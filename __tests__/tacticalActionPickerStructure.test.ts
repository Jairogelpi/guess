import fs from 'node:fs'
import path from 'node:path'

test('tactical picker uses one primary helper instead of mapping every disabled note', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'game', 'TacticalActionPicker.tsx'),
    'utf8',
  )

  expect(source).toContain('getPrimaryTacticalHelperReason')
  expect(source).not.toContain('.filter((action) => action.disabledReasonKey)')
  expect(source).not.toContain('key={`${action.id}-note`}')
})
