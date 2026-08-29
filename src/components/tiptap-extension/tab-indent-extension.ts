import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

export interface IndentOptions {
  types: string[]
  minLevel: number
  maxLevel: number
  indentUnit: string // '1.5rem'
  defaultFirstLineIndent: string // '1.25cm'
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Incrementa o nível de indentação do bloco
       */
      indent: () => ReturnType
      /**
       * Decrementa o nível de indentação do bloco
       */
      outdent: () => ReturnType
      /**
       * Define o nível exato de indentação
       */
      setIndent: (level: number) => ReturnType
      /**
       * Alterna o recuo de primeira linha (padrão forense de 1.25cm)
       */
      toggleFirstLineIndent: (size?: string) => ReturnType
      /**
       * Define o recuo de primeira linha
       */
      setFirstLineIndent: (size: string | null) => ReturnType
    }
  }
}

export const TabIndentExtension = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minLevel: 0,
      maxLevel: 8,
      indentUnit: '1.5rem',
      defaultFirstLineIndent: '1.25cm',
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indentLevel: {
            default: 0,
            parseHTML: (element) => {
              const rawLevel = element.getAttribute('data-indent-level')
              if (rawLevel) {
                const parsed = parseInt(rawLevel, 10)
                return isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, 8))
              }

              // Suporte a parsing via inline styles: margin-left ou padding-left
              const style = element.style
              const marginLeft = style.marginLeft || style.paddingLeft
              if (marginLeft) {
                if (marginLeft.includes('rem')) {
                  const val = parseFloat(marginLeft)
                  return Math.round(val / 1.5)
                }
                if (marginLeft.includes('px')) {
                  const val = parseFloat(marginLeft)
                  return Math.round(val / 24)
                }
                if (marginLeft.includes('cm')) {
                  const val = parseFloat(marginLeft)
                  return Math.round(val / 1.25)
                }
              }

              return 0
            },
            renderHTML: (attributes) => {
              const level = Number(attributes.indentLevel) || 0
              if (level <= 0) return {}

              return {
                'data-indent-level': level,
                style: `margin-left: ${level * 1.5}rem;`,
              }
            },
          },
          firstLineIndent: {
            default: null,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-first-line-indent')
              if (raw) return raw

              const style = element.style
              if (style.textIndent) {
                return style.textIndent
              }

              return null
            },
            renderHTML: (attributes) => {
              if (!attributes.firstLineIndent) return {}

              return {
                'data-first-line-indent': attributes.firstLineIndent,
                style: `text-indent: ${attributes.firstLineIndent};`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection
          let modified = false

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentLevel = Number(node.attrs.indentLevel) || 0
              if (currentLevel < this.options.maxLevel) {
                const nextLevel = currentLevel + 1
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indentLevel: nextLevel,
                })
                modified = true
              }
              return false
            }
          })

          if (modified && dispatch) {
            dispatch(tr)
            return true
          }
          return false
        },

      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection
          let modified = false

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentLevel = Number(node.attrs.indentLevel) || 0
              const hasFirstLine = Boolean(node.attrs.firstLineIndent)

              if (currentLevel > this.options.minLevel) {
                const nextLevel = currentLevel - 1
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indentLevel: nextLevel,
                })
                modified = true
              } else if (hasFirstLine) {
                // Se o nível já for 0 mas tem firstLineIndent, remove o firstLineIndent
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  firstLineIndent: null,
                })
                modified = true
              }
              return false
            }
          })

          if (modified && dispatch) {
            dispatch(tr)
            return true
          }
          return false
        },

      setIndent:
        (level: number) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection
          const clamped = Math.max(
            this.options.minLevel,
            Math.min(level, this.options.maxLevel)
          )
          let modified = false

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indentLevel: clamped,
              })
              modified = true
              return false
            }
          })

          if (modified && dispatch) {
            dispatch(tr)
            return true
          }
          return false
        },

      toggleFirstLineIndent:
        (size?: string) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection
          const targetSize = size || this.options.defaultFirstLineIndent
          let modified = false

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = node.attrs.firstLineIndent
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                firstLineIndent: current ? null : targetSize,
              })
              modified = true
              return false
            }
          })

          if (modified && dispatch) {
            dispatch(tr)
            return true
          }
          return false
        },

      setFirstLineIndent:
        (size: string | null) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection
          let modified = false

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                firstLineIndent: size,
              })
              modified = true
              return false
            }
          })

          if (modified && dispatch) {
            dispatch(tr)
            return true
          }
          return false
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const { state } = this.editor
        const { selection } = state
        const { $from } = selection

        // Se o cursor estiver dentro de uma lista (listItem / taskItem),
        // deixa o comportamento nativo de lista do StarterKit / TaskList lidar com o aninhamento
        for (let d = $from.depth; d > 0; d--) {
          const nodeName = $from.node(d).type.name
          if (
            nodeName === 'listItem' ||
            nodeName === 'taskItem' ||
            nodeName === 'bulletList' ||
            nodeName === 'orderedList' ||
            nodeName === 'taskList'
          ) {
            return false
          }
        }

        // Executa indentação de bloco no parágrafo ou heading atual
        return this.editor.commands.indent()
      },

      'Shift-Tab': () => {
        const { state } = this.editor
        const { selection } = state
        const { $from } = selection

        // Se estiver em lista, deixa o atalho de outdent de lista padrão cuidar
        for (let d = $from.depth; d > 0; d--) {
          const nodeName = $from.node(d).type.name
          if (
            nodeName === 'listItem' ||
            nodeName === 'taskItem' ||
            nodeName === 'bulletList' ||
            nodeName === 'orderedList' ||
            nodeName === 'taskList'
          ) {
            return false
          }
        }

        // Executa outdent no parágrafo/heading atual
        return this.editor.commands.outdent()
      },

      Backspace: () => {
        const { state } = this.editor
        const { selection } = state

        // Se há texto selecionado, deixa o comportamento normal de exclusão
        if (!selection.empty) {
          return false
        }

        const { $from } = selection

        // Verifica se o cursor está no início do bloco de texto (offset 0)
        if ($from.parentOffset === 0) {
          const parentNode = $from.parent

          if (this.options.types.includes(parentNode.type.name)) {
            const hasFirstLine = Boolean(parentNode.attrs.firstLineIndent)
            const currentIndent = Number(parentNode.attrs.indentLevel) || 0

            // 1. Se tiver firstLineIndent, remove ele primeiro
            if (hasFirstLine) {
              return this.editor.commands.setFirstLineIndent(null)
            }

            // 2. Se tiver indentLevel > 0, reduz o indent (comportamento Google Docs / Word)
            if (currentIndent > 0) {
              return this.editor.commands.outdent()
            }
          }
        }

        // Comportamento normal de Backspace do ProseMirror
        return false
      },
    }
  },
})

