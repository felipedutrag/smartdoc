import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface AiAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
  endpoint?: string;
  enabled?: boolean;
}

export interface AiAutocompleteStorage {
  suggestion: string | null;
  pos: number | null;
  abortController: AbortController | null;
  debounceTimer: any;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiAutocomplete: {
      acceptAiAutocomplete: () => ReturnType;
      dismissAiAutocomplete: () => ReturnType;
    };
  }
}

const aiAutocompletePluginKey = new PluginKey<{ decorations: DecorationSet }>("aiAutocomplete");

export const AiAutocompleteExtension = Extension.create<AiAutocompleteOptions, AiAutocompleteStorage>({
  name: "aiAutocomplete",
  priority: 1000,

  addOptions() {
    return {
      debounceMs: 350,
      minChars: 2,
      endpoint: "/api/gemini/autocomplete",
      enabled: true,
    };
  },

  addStorage() {
    return {
      suggestion: null,
      pos: null,
      abortController: null,
      debounceTimer: null,
    };
  },

  addCommands() {
    return {
      acceptAiAutocomplete:
        () =>
        ({ tr, dispatch }) => {
          const storage = this.storage;
          if (!storage.suggestion) {
            return false;
          }

          const textToInsert = storage.suggestion;

          if (storage.debounceTimer) {
            clearTimeout(storage.debounceTimer);
            storage.debounceTimer = null;
          }
          if (storage.abortController) {
            storage.abortController.abort();
            storage.abortController = null;
          }

          storage.suggestion = null;
          storage.pos = null;

          if (dispatch) {
            const pos = tr.selection.from;
            tr.insertText(textToInsert, pos)
              .setMeta(aiAutocompletePluginKey, { clear: true });
          }

          return true;
        },

      dismissAiAutocomplete:
        () =>
        ({ tr, dispatch }) => {
          const storage = this.storage;
          if (!storage.suggestion) {
            return false;
          }

          if (storage.debounceTimer) {
            clearTimeout(storage.debounceTimer);
            storage.debounceTimer = null;
          }
          if (storage.abortController) {
            storage.abortController.abort();
            storage.abortController = null;
          }

          storage.suggestion = null;
          storage.pos = null;

          if (dispatch) {
            tr.setMeta(aiAutocompletePluginKey, { clear: true });
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return this.editor.commands.acceptAiAutocomplete();
      },
      Escape: () => {
        return this.editor.commands.dismissAiAutocomplete();
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    const options = this.options;

    return [
      new Plugin<{ decorations: DecorationSet }>({
        key: aiAutocompletePluginKey,

        state: {
          init() {
            return { decorations: DecorationSet.empty };
          },

          apply(tr, prevState, oldEditorState, newEditorState) {
            const meta = tr.getMeta(aiAutocompletePluginKey);

            // Renderizar sugestão
            if (meta?.suggestion && meta?.pos !== undefined) {
              const widget = Decoration.widget(
                meta.pos,
                () => {
                  const span = document.createElement("span");
                  span.className = "tiptap-ghost-text";
                  span.setAttribute("contenteditable", "false");
                  span.setAttribute("data-ghost-text", "true");
                  span.textContent = meta.suggestion;

                  const badge = document.createElement("span");
                  badge.className = "tiptap-ghost-badge";
                  badge.setAttribute("contenteditable", "false");
                  badge.textContent = "Tab ↹";
                  span.appendChild(badge);

                  return span;
                },
                { side: 1, stopEvent: () => true }
              );

              return {
                decorations: DecorationSet.create(newEditorState.doc, [widget]),
              };
            }

            // Limpar
            if (meta?.clear) {
              return { decorations: DecorationSet.empty };
            }

            // Se o documento mudou ou a seleção mudou fora da meta do plugin
            if (tr.docChanged || tr.selectionSet) {
              if (extension.storage.suggestion) {
                extension.storage.suggestion = null;
                extension.storage.pos = null;
              }
              return { decorations: DecorationSet.empty };
            }

            return prevState;
          },
        },

        props: {
          decorations(state) {
            return this.getState(state)?.decorations ?? DecorationSet.empty;
          },

          handleKeyDown(view, event) {
            // Se o usuário apertar Tab e houver sugestão, consome preventDefault no nível de DOM nativo
            if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
              if (extension.storage.suggestion) {
                event.preventDefault();
                event.stopPropagation();
                return extension.editor.commands.acceptAiAutocomplete();
              }
            }

            if (event.key === "Escape") {
              if (extension.storage.suggestion) {
                event.preventDefault();
                event.stopPropagation();
                return extension.editor.commands.dismissAiAutocomplete();
              }
            }

            return false;
          },
        },

        view(editorView) {
          const fetchSuggestion = async () => {
            if (!options.enabled) return;

            const { state } = editorView;
            const { selection, doc } = state;

            // Só ativa em seleção simples (sem texto selecionado)
            if (!selection.empty) return;

            const pos = selection.from;
            const textBefore = doc.textBetween(0, pos, "\n", " ");
            const textAfter = doc.textBetween(pos, Math.min(pos + 300, doc.content.size), "\n", " ");

            const minLength = options.minChars ?? 2;
            if (!textBefore || textBefore.trim().length < minLength) {
              return;
            }

            // Cancela requisição anterior
            if (extension.storage.abortController) {
              extension.storage.abortController.abort();
            }
            extension.storage.abortController = new AbortController();

            let facts = "";
            let title = "";
            if (typeof window !== "undefined") {
              facts = localStorage.getItem("extrajus_facts") || "";
            }

            try {
              const res = await fetch(options.endpoint || "/api/gemini/autocomplete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  prefix: textBefore,
                  suffix: textAfter,
                  facts,
                  title,
                }),
                signal: extension.storage.abortController.signal,
              });

              if (!res.ok) return;
              const data = await res.json();

              if (data.suggestion && data.suggestion.trim().length > 0) {
                const currentPos = editorView.state.selection.from;
                if (currentPos === pos && editorView.state.selection.empty && editorView.hasFocus()) {
                  extension.storage.suggestion = data.suggestion;
                  extension.storage.pos = currentPos;

                  const tr = editorView.state.tr.setMeta(aiAutocompletePluginKey, {
                    suggestion: data.suggestion,
                    pos: currentPos,
                  });
                  editorView.dispatch(tr);
                }
              }
            } catch (err: any) {
              if (err?.name !== "AbortError") {
                console.error("[AiAutocomplete] Fetch error:", err);
              }
            }
          };

          return {
            update(view, prevState) {
              const stateChanged = !prevState.doc.eq(view.state.doc);
              const selectionChanged = !prevState.selection.eq(view.state.selection);

              if (stateChanged || selectionChanged) {
                if (extension.storage.debounceTimer) {
                  clearTimeout(extension.storage.debounceTimer);
                  extension.storage.debounceTimer = null;
                }

                if (view.hasFocus() && view.state.selection.empty && view.props.editable?.(view.state) !== false) {
                  extension.storage.debounceTimer = setTimeout(() => {
                    fetchSuggestion();
                  }, options.debounceMs ?? 350);
                }
              }
            },

            destroy() {
              if (extension.storage.debounceTimer) {
                clearTimeout(extension.storage.debounceTimer);
              }
              if (extension.storage.abortController) {
                extension.storage.abortController.abort();
              }
            },
          };
        },
      }),
    ];
  },
});
