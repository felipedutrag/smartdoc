import { Extension } from '@tiptap/core'

export const TabIndentExtension = Extension.create({
  name: 'tabIndent',

  addKeyboardShortcuts() {
    return {
      'Tab': () => {
        // 4 espaços inquebráveis (&nbsp;&nbsp;&nbsp;&nbsp;) que persistem no HTML/Supabase e reloads
        return this.editor.commands.insertContent('\u00a0\u00a0\u00a0\u00a0')
      },
    }
  },
})
