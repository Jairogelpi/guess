import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.argv[2] ?? 'http://localhost:8081'
const hostName = process.argv[3] ?? 'Host'
const player2Name = process.argv[4] ?? 'Player 2'
const player3Name = process.argv[5] ?? 'Player 3'
const exitOnSuccess = process.env.ROOM_OPEN_EXIT_ON_SUCCESS === '1'

function debugArtifactPath(name, suffix) {
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return path.join(process.cwd(), '.tmp-room-open-debug', `${safe}-${suffix}`)
}

async function launchPlayer(browser, name) {
  const context = await browser.newContext({
    viewport: { width: 430, height: 920 },
  })
  const page = await context.newPage()
  return { name, context, page }
}

async function gotoHome(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
}

async function clickGuest(page) {
  const guestButton = page.getByRole('button', { name: /ENTRAR COMO INVITADO|ENTER AS GUEST/i })
  await guestButton.waitFor({ state: 'visible', timeout: 30000 })
  await clickLocator(guestButton)
}

async function clickLocator(locator) {
  try {
    await locator.click({ force: true, timeout: 5000 })
  } catch {
    await locator.evaluate((element) => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
  }
}

async function waitForRoomHome(page, playerName) {
  const nameInput = page.getByLabel(/TU NOMBRE|YOUR NAME/i).or(page.getByPlaceholder(/TU NOMBRE|YOUR NAME/i))
  const createButton = page.getByRole('button', { name: /CREAR SALA|CREATE ROOM/i })
  const joinButton = page.getByRole('button', { name: /UNIRSE|JOIN ROOM/i })

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (await nameInput.isVisible().catch(() => false)) {
      if (await createButton.isVisible().catch(() => false)) return
      if (await joinButton.isVisible().catch(() => false)) return
    }

    await page.waitForTimeout(1500)

    if (attempt === 2 || attempt === 4) {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    }
  }

  const currentUrl = page.url()
  const visibleButtons = await page
    .locator('button, [role="button"]')
    .evaluateAll((elements) => elements.map((element) => element.textContent?.trim() ?? '').filter(Boolean))
  const visibleInputs = await page.locator('input').evaluateAll((elements) =>
    elements.map((element) => ({
      type: element.getAttribute('type'),
      placeholder: element.getAttribute('placeholder'),
      value: element.value,
      ariaLabel: element.getAttribute('aria-label'),
    })),
  )
  const bodyText = await page.locator('body').innerText().catch(() => '')
  const debugDir = path.join(process.cwd(), '.tmp-room-open-debug')
  fs.mkdirSync(debugDir, { recursive: true })
  await page.screenshot({ path: debugArtifactPath(playerName, 'room-home-failure.png'), fullPage: true })
  fs.writeFileSync(
    debugArtifactPath(playerName, 'room-home-failure.json'),
    JSON.stringify({ currentUrl, visibleButtons, visibleInputs, bodyText }, null, 2),
  )

  throw new Error(
    `Home screen did not render create/join controls. URL: ${currentUrl}. Buttons: ${visibleButtons.join(' | ')}`,
  )
}

async function fillHome(page, displayName, joinCode = null) {
  const nameInput = page.getByLabel(/TU NOMBRE|YOUR NAME/i).or(page.getByPlaceholder(/TU NOMBRE|YOUR NAME/i))
  await nameInput.fill(displayName)
  if (joinCode) {
    const joinCodeInput = page.getByLabel(/CODIGO|CODE/i).or(page.getByPlaceholder(/CODIGO|CODE/i))
    await joinCodeInput.fill(joinCode)
  }
}

async function createRoom(page, displayName) {
  await fillHome(page, displayName)
  const createButton = page.getByRole('button', { name: /CREAR SALA|CREATE ROOM/i })
  await createButton.waitFor({ state: 'attached', timeout: 30000 })
  await createButton.scrollIntoViewIfNeeded()
  await createButton.waitFor({ state: 'visible', timeout: 30000 })
  await clickLocator(createButton)
  await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/, { timeout: 30000 })
  const match = page.url().match(/\/room\/([A-Z0-9]{6})\/lobby/)
  if (!match) throw new Error('Could not read room code from host URL')
  const code = match[1]
  await ensureLobbyReady(page, code)
  return code
}

async function joinRoom(page, displayName, code) {
  await fillHome(page, displayName, code)
  const joinButton = page.getByRole('button', { name: /UNIRSE|JOIN ROOM/i })
  await joinButton.waitFor({ state: 'attached', timeout: 30000 })
  await joinButton.scrollIntoViewIfNeeded()
  await joinButton.waitFor({ state: 'visible', timeout: 30000 })
  await clickLocator(joinButton)
  await page.waitForURL(new RegExp(`/room/${code}/lobby`), { timeout: 30000 })
  await ensureLobbyReady(page, code)
}

async function markReady(page) {
  const readyButton = page.getByRole('button', { name: /LISTO|READY/i })
  await readyButton.waitFor({ state: 'visible', timeout: 30000 })
  await readyButton.scrollIntoViewIfNeeded()
  await clickLocator(readyButton)
  await page.waitForFunction(
    () => {
      // Keep using data-testid here as a backup or if it's rendered by other components
      const ready = document.querySelector('[data-testid="lobby-unready-button"]') || 
                    [...document.querySelectorAll('button')].find(b => /NO LISTO|UNREADY/i.test(b.textContent))
      return !!ready
    },
    { timeout: 30000 },
  )
}

async function waitForEnabled(page, locator, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const disabled = await locator.isDisabled().catch(() => true)
    if (!disabled) return
    await page.waitForTimeout(300)
  }
  throw new Error('Timed out waiting for enabled control')
}

async function ensureLobbyReady(page, code) {
  const shareCode = page.getByText(/Comparte el codigo|Share code/i)
  const playerCount = page.getByText(/jugadores|players/i).first()
  const loadFailed = page.getByText(/No se pudo cargar la sala|Could not load the room/i)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await loadFailed.isVisible().catch(() => false)) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForURL(new RegExp(`/room/${code}/lobby`), { timeout: 30000 })
      await page.waitForTimeout(1200)
      continue
    }

    if (await shareCode.isVisible().catch(() => false)) return
    if (await playerCount.isVisible().catch(() => false)) return

    await page.waitForTimeout(800)
  }

  if (await loadFailed.isVisible().catch(() => false)) {
    throw new Error(`Lobby load failed for room ${code} after retries`)
  }

  throw new Error(`Lobby did not become ready for room ${code}`)
}

async function waitForGame(page, code, playerName) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForURL(new RegExp(`/room/${code}/game`), { timeout: 12000 })
      return
    } catch {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)
    }
  }

  const currentUrl = page.url()
  await page.screenshot({ path: debugArtifactPath(playerName, 'game-navigation-failure.png'), fullPage: true })
  throw new Error(`Player ${playerName} did not reach /game. Current URL: ${currentUrl}`)
}

async function main() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: false,
  })

  const host = await launchPlayer(browser, hostName)
  const player2 = await launchPlayer(browser, player2Name)
  const player3 = await launchPlayer(browser, player3Name)

  const players = [host, player2, player3]

  try {
    for (const player of players) {
      console.log(`Launching ${player.name}...`)
      await gotoHome(player.page)
      await clickGuest(player.page)
      await waitForRoomHome(player.page, player.name)
    }

    console.log('Creating room as Host...')
    const code = await createRoom(host.page, host.name)
    console.log(`Room created: ${code}. Joining players...`)
    await joinRoom(player2.page, player2.name, code)
    await joinRoom(player3.page, player3.name, code)
    
    console.log('Marking players 2 and 3 as READY...')
    await markReady(player2.page)
    await markReady(player3.page)

    const startButton = host.page.getByRole('button', { name: /EMPEZAR PARTIDA|START GAME/i })
    
    console.log('Waiting for START GAME button visibility...')
    // Wait for the start button with reloads if needed
    let startButtonVisible = false
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await startButton.waitFor({ state: 'visible', timeout: 5000 })
        startButtonVisible = true
        break
      } catch {
        console.warn(`Lobby sync attempt ${attempt + 1}: reloading host page...`)
        await host.page.reload({ waitUntil: 'domcontentloaded' })
        await ensureLobbyReady(host.page, code)
      }
    }

    if (!startButtonVisible) {
      throw new Error('Host could not see START GAME button after multiple reloads')
    }

    console.log('START GAME button found. Waiting for it to be enabled...')
    await waitForEnabled(host.page, startButton, 30000)
    console.log('Clicking START GAME...')
    await clickLocator(startButton)

    console.log('Waiting for all players to reach /game...')
    await Promise.all(players.map((player) => waitForGame(player.page, code, player.name)))

    console.log(`3 players opened and game started: ${code}`)
    if (exitOnSuccess) {
      await Promise.all(players.map((player) => player.context.close().catch(() => undefined)))
      await browser.close().catch(() => undefined)
      return
    }

    console.log('Keep the windows open. Stop with Ctrl+C.')

    process.on('SIGINT', async () => {
      await Promise.all(players.map((player) => player.context.close().catch(() => undefined)))
      process.exit(0)
    })

    await new Promise(() => {})
  } catch (error) {
    console.error('FAILED to complete 3-player room flow')
    console.error(error)
    await Promise.all(players.map((player) => player.context.close().catch(() => undefined)))
    await browser.close().catch(() => undefined)
    process.exit(1)
  }
}

main()
