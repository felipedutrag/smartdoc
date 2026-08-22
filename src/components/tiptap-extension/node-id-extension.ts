import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

function generateId() {
  return `node-${Math.random().toString(36).substring(2, 10)}`
}

export const NodeIdExtension = Extension.create({
  name: 'nodeId',

    addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem'],
        attributes: {
          id: {
            default: null,
            keepOnSplit: false,
            parseHTML: element => element.getAttribute('id'),
            renderHTML: attributes => {
              if (!attributes.id) return {}
              return { id: attributes.id }
            },
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    const types = ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem']
    return [
      new Plugin({
        key: new PluginKey('nodeId'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) {
            return null
          }

          let tr = newState.tr
          let modified = false

          newState.doc.descendants((node, pos) => {
            if (node.isBlock && types.includes(node.type.name)) {
              if (!node.attrs.id) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: generateId() })
                modified = true
              }
            }
          })

          return modified ? tr : null
        },
      }),
    ]
  },
})
