import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.argv[2] ?? 'http://localhost:8081'
const hostName = process.argv[3] ?? 'Host'
const player2Name = process.argv[4] ?? 'Player 2'
const player3Name = process.argv[5] ?? 'Player 3'

function makeProfileDir(name) {
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return path.join(os.tmpdir(), `dixit-3p-${safe}`)
}

function debugArtifactPath(name, suffix) {
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return path.join(process.cwd(), '.tmp-room-open-debug', `${safe}-${suffix}`)
}

async function launchPlayer(name) {
  const userDataDir = makeProfileDir(name)
  fs.rmSync(userDataDir, { recursive: true, force: true })

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'msedge',
    headless: false,
    viewport: { width: 430, height: 920 },
  })

  const page = context.pages()[0] ?? await context.newPage()
  return { name, context, page }
}

async function gotoHome(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
}

async function forceTabsHome(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
}

async function waitForAuthHydration(page) {
  await page.waitForFunction(
    () => Object.keys(window.localStorage).some((key) => {
      if (!key.includes('auth-token')) return false
      const value = window.localStorage.getItem(key)
      return typeof value === 'string' && value.includes('access_token')
    }),
    { timeout: 30000 },
  )
}

async function clickGuest(page) {
  const guestButton = page.getByRole('button', { name: /Entrar como invitado|Enter as guest/i })
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

function buttonByText(page, pattern) {
  return page.locator('button, [role="button"]').filter({ hasText: pattern }).first()
}

async function waitForRoomHome(page, playerName) {
  const nameInput = page.locator('input').first()
  const createButton = buttonByText(page, /Crear sala|Create room/i)
  const joinButton = buttonByText(page, /Unirse|Join/i)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await nameInput.waitFor({ state: 'visible', timeout: 30000 })

    if (await createButton.isVisible().catch(() => false)) return
    if (await joinButton.isVisible().catch(() => false)) return

    await forceTabsHome(page)
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
  const inputs = page.locator('input')
  await inputs.nth(0).fill(displayName)
  if (joinCode) {
    await inputs.nth(1).fill(joinCode)
  }
}

async function createRoom(page, displayName) {
  await fillHome(page, displayName)
  const createButton = buttonByText(page, /Crear sala|Create room/i)
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
  const joinButton = buttonByText(page, /Unirse|Join/i)
  await joinButton.waitFor({ state: 'attached', timeout: 30000 })
  await joinButton.scrollIntoViewIfNeeded()
  await joinButton.waitFor({ state: 'visible', timeout: 30000 })
  await clickLocator(joinButton)
  await page.waitForURL(new RegExp(`/room/${code}/lobby`), { timeout: 30000 })
  await ensureLobbyReady(page, code)
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

async function main() {
  const host = await launchPlayer(hostName)
  const player2 = await launchPlayer(player2Name)
  const player3 = await launchPlayer(player3Name)

  const players = [host, player2, player3]

  try {
    for (const player of players) {
      await gotoHome(player.page)
      await clickGuest(player.page)
      await waitForAuthHydration(player.page)
      await forceTabsHome(player.page)
      await waitForRoomHome(player.page, player.name)
    }

    const code = await createRoom(host.page, host.name)
    await joinRoom(player2.page, player2.name, code)
    await joinRoom(player3.page, player3.name, code)

    const startButton = buttonByText(host.page, /Empezar partida|Start game/i)
    await startButton.waitFor({ state: 'visible', timeout: 30000 })
    await waitForEnabled(host.page, startButton, 30000)
    await clickLocator(startButton)

    await Promise.all(
      players.map((player) =>
        player.page.waitForURL(new RegExp(`/room/${code}/game`), { timeout: 30000 }),
      ),
    )

    console.log(`3 players opened and game started: ${code}`)
    console.log('Keep the windows open. Stop with Ctrl+C.')

    process.on('SIGINT', async () => {
      await Promise.all(players.map((player) => player.context.close().catch(() => undefined)))
      process.exit(0)
    })

    await new Promise(() => {})
  } catch (error) {
    console.error('Failed to open 3-player room flow')
    console.error(error)
    await Promise.all(players.map((player) => player.context.close().catch(() => undefined)))
    process.exit(1)
  }
}

main()
