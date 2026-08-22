"use client"

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import { EditorState } from "@tiptap/pm/state"

const clearEditorHistory = (editor: any) => {
  if (!editor) return;
  try {
    const newDoc = editor.schema.nodeFromJSON(editor.getJSON());
    const newState = EditorState.create({
      doc: newDoc,
      plugins: editor.state.plugins,
      schema: editor.schema
    });
    editor.view.updateState(newState);
  } catch (e) {
    console.error("Failed to clear editor history:", e);
  }
};

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { NodeIdExtension } from "@/components/tiptap-extension/node-id-extension"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"
import Link from "next/link"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  leftContent,
  rightContent,
  disabled = false,
  editor,
  clearHighlights,
  isUndoDisabled = false,
  fontSize,
  increaseFontSize,
  decreaseFontSize,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean | undefined
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  disabled?: boolean
  editor: any
  clearHighlights: () => void
  isUndoDisabled?: boolean
  fontSize?: number
  increaseFontSize?: () => void
  decreaseFontSize?: () => void
}) => {
  if (isMobile === true) {
    return (
      <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        {/* Left side: Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 4
          }}>
            <span style={{ fontSize: 16, fontFamily: "var(--font-sans), sans-serif", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 0, textTransform: "none", position: "relative" }}>
              <span style={{ fontWeight: 400, letterSpacing: "-0.05em" }}>SMART</span>
              <span style={{ fontWeight: 900, color: "#d97706", letterSpacing: "-0.05em", marginLeft: 2 }}>DOC</span>
              <span style={{ 
                position: "absolute",
                top: -5,
                right: -18,
                background: "rgba(217, 119, 6, 0.12)", 
                border: "1px solid rgba(217, 119, 6, 0.25)",
                color: "#d97706", 
                fontSize: 7, 
                fontWeight: 900, 
                padding: "0.2px 2px",
                borderRadius: "2px",
                textTransform: "uppercase",
                opacity: 1
              }}>
                IA
              </span>
            </span>
          </div>
        </Link>

        {/* Right side: Font size + Theme Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>

          {fontSize !== undefined && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "2px 4px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
            }}>
              <button
                onClick={disabled ? undefined : decreaseFontSize}
                title="Diminuir Fonte"
                style={{
                  width: "22px", height: "22px", borderRadius: "4px",
                  border: "none", background: "transparent",
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontSize: "11px", fontWeight: 700,
                  color: "var(--text-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: disabled ? 0.4 : 1,
                }}
              >A-</button>
              <span style={{
                fontSize: "11px", fontWeight: 700,
                color: "var(--text-secondary)",
                minWidth: "26px", textAlign: "center",
                fontVariantNumeric: "tabular-nums",
              }}>{fontSize}px</span>
              <button
                onClick={disabled ? undefined : increaseFontSize}
                title="Aumentar Fonte"
                style={{
                  width: "22px", height: "22px", borderRadius: "4px",
                  border: "none", background: "transparent",
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontSize: "11px", fontWeight: 700,
                  color: "var(--text-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: disabled ? 0.4 : 1,
                }}
              >A+</button>
            </div>
          )}
          <ToolbarGroup style={{ transform: "scale(1.15)", transformOrigin: "right center" }}>
            <ThemeToggle />
          </ToolbarGroup>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ 
        display: "flex", 
        width: "100%", 
        alignItems: "center", 
        position: "relative" 
      }}>
        {/* Left side: History, Headings, Lists, Text formatting */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: "8px" }}>
          {leftContent && <div style={{ flexShrink: 0 }}>{leftContent}</div>}
          <ToolbarGroup style={{ ... (disabled ? { pointerEvents: "none", opacity: 0.55 } : {}), flexShrink: 0 }}>
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
          </ToolbarGroup>

          {isMobile === false && (
            <>
              <ToolbarSeparator />
              <ToolbarGroup style={{ ... (disabled ? { pointerEvents: "none", opacity: 0.55 } : {}), flexShrink: 0 }}>
                <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
                <ListDropdownMenu
                  modal={false}
                  types={["bulletList", "orderedList", "taskList"]}
                />
              </ToolbarGroup>
              
              <ToolbarSeparator />
              <ToolbarGroup style={{ ... (disabled ? { pointerEvents: "none", opacity: 0.55 } : {}), flexShrink: 0 }}>
                <MarkButton type="bold" />
                <MarkButton type="italic" />
                <MarkButton type="underline" />
              </ToolbarGroup>
            </>
          )}
        </div>

        {/* Center: Logo - PERFECTLY CENTERED */}
        <Link 
          href="/dashboard"
          style={{ 
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textDecoration: "none"
          }}
        >
          <span style={{ fontSize: 17, fontFamily: "var(--font-sans), sans-serif", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 0, textTransform: "none", position: "relative" }}>
            <span style={{ fontWeight: 400, letterSpacing: "-0.05em" }}>SMART</span>
            <span style={{ fontWeight: 900, color: "#d97706", letterSpacing: "-0.05em", marginLeft: 2 }}>DOC</span>
            <span style={{ 
              position: "absolute",
              top: -2,
              right: -22,
              background: "rgba(217, 119, 6, 0.12)", 
              border: "1px solid rgba(217, 119, 6, 0.25)",
              color: "#d97706", 
              fontSize: 8, 
              fontWeight: 900, 
              padding: "0.5px 3.5px",
              borderRadius: "3px",
              textTransform: "uppercase",
              opacity: 1
            }}>
              IA
            </span>
          </span>
        </Link>

        {isMobile === false && (
          <div style={{ display: "flex", alignItems: "center", marginLeft: "auto", flexShrink: 0 }}>
            <ToolbarGroup style={disabled ? { pointerEvents: "none", opacity: 0.55 } : undefined}>
              <MarkButton type="strike" />
              <ColorHighlightPopover />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup style={disabled ? { pointerEvents: "none", opacity: 0.55 } : undefined}>
              <TextAlignButton align="left" />
              <TextAlignButton align="center" />
              <TextAlignButton align="right" />
              <TextAlignButton align="justify" />
            </ToolbarGroup>
          </div>
        )}

        {/* Far Right Corner items */}
        {isMobile === false ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: 8 }}>
            {rightContent && (
              <ToolbarGroup>{rightContent}</ToolbarGroup>
            )}

            {/* Font size controls — desktop only */}
            {fontSize !== undefined && (
              <>
                <ToolbarSeparator />
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                }}>
                  <button
                    onClick={disabled ? undefined : decreaseFontSize}
                    title="Diminuir Fonte"
                    style={{
                      width: "22px", height: "22px", borderRadius: "5px",
                      border: "none", background: "transparent",
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontSize: "11px", fontWeight: 700,
                      color: "var(--text-primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: disabled ? 0.4 : 1,
                    }}
                  >A-</button>
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    color: "var(--text-secondary)",
                    minWidth: "32px", textAlign: "center",
                    fontVariantNumeric: "tabular-nums",
                  }}>{fontSize}px</span>
                  <button
                    onClick={disabled ? undefined : increaseFontSize}
                    title="Aumentar Fonte"
                    style={{
                      width: "22px", height: "22px", borderRadius: "5px",
                      border: "none", background: "transparent",
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontSize: "11px", fontWeight: 700,
                      color: "var(--text-primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: disabled ? 0.4 : 1,
                    }}
                  >A+</button>
                </div>
              </>
            )}

            <ToolbarGroup>
              <ThemeToggle />
            </ToolbarGroup>
          </div>
        ) : (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", flexShrink: 0, gap: "6px" }}>
            {rightContent && (
              <>
                <ToolbarSeparator />
                <ToolbarGroup>{rightContent}</ToolbarGroup>
              </>
            )}
            <ToolbarGroup>
              <ThemeToggle />
            </ToolbarGroup>
          </div>
        )}
      </div>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export interface SimpleEditorRef {
  handleOrbiRewrite: (externalInstruction?: string) => Promise<void>;
}

const cleanMarkdownBold = (html: string): string => {
  if (!html) return "";
  let cleaned = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  cleaned = cleaned.replace(/__(.*?)__/g, "<strong>$1</strong>");
  return cleaned;
};

export const SimpleEditor = forwardRef<SimpleEditorRef, { 
  children?: React.ReactNode,
  leftContent?: React.ReactNode,
  rightContent?: React.ReactNode,
  editable?: boolean,
  onUnlockRequest?: () => void,
  discountActive?: boolean,
  discountTimerDisplay?: string,
  price?: number,
  isGenerating?: boolean,
  isRewriting?: boolean,
  setIsRewriting?: (isRewriting: boolean) => void,
  isPaid?: boolean,
  onActiveEditChange?: (active: boolean) => void
}>(({ 
  children,
  leftContent,
  rightContent,
  editable = true,
  onUnlockRequest,
  discountActive = false,
  discountTimerDisplay = "05:00",
  price = 37.00,
  isGenerating = false,
  isRewriting: isRewritingProp,
  setIsRewriting: setIsRewritingProp,
  isPaid = false,
  onActiveEditChange
}, ref) => {
  const isMobileRaw = useIsBreakpoint()
  const isMobile = isMobileRaw ?? false;
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(17)
  const [contentVersion, setContentVersion] = useState(0)
  const [preAiEditContent, setPreAiEditContent] = useState<string | null>(null)

  const [localIsRewriting, setLocalIsRewriting] = useState(false);
  const isRewriting = isRewritingProp !== undefined ? isRewritingProp : localIsRewriting;
  const setIsRewriting = setIsRewritingProp !== undefined ? setIsRewritingProp : setLocalIsRewriting;

  const [lockHeight, setLockHeight] = useState<string>("350vh");

  useEffect(() => {
    if (isMobile === true) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFontSize(12)
    }
  }, [isMobile])



  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, 24))
  }

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, 9))
  }

  const editor = useEditor({
    immediatelyRender: false,
    editable: editable,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
      handlePaste: () => false,
      handleDrop: () => !editable,
      handleDOMEvents: {
        copy: (view, event) => {
          return false;
        },
        cut: (view, event) => {
          return false;
        },
        contextmenu: (view, event) => {
          return false;
        }
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      NodeIdExtension,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    onUpdate: ({ editor }) => {
      // Optional: save to localstorage as user types
      if (editable) {
        localStorage.setItem("extrajus_draft", editor.getHTML());
      }
      setContentVersion(prev => prev + 1);
    }
  })

  useEffect(() => {
    if (!editor) return;

    const calculateLockHeight = () => {
      setLockHeight("none");
    };

    calculateLockHeight();
    
    if (!isPaid && !isGenerating) {
       const observer = new ResizeObserver(calculateLockHeight);
       observer.observe(editor.view.dom);
       return () => observer.disconnect();
    }
  }, [isPaid, isGenerating, editor, contentVersion]);

  const isUndoDisabled = React.useMemo(() => {
    if (!editor) return true
    return !editor.can().undo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, contentVersion])

  // Load initial content on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!editor) return;
    const initialContent = localStorage.getItem("extrajus_draft") || "";
    if (initialContent) {
      const cleaned = cleanMarkdownBold(initialContent);
      if (editor.getHTML() !== cleaned) {
        editor.commands.setContent(cleaned, { emitUpdate: false });
        clearEditorHistory(editor);
      }
    }
    setContentVersion(prev => prev + 1);
  }, [editor]);

  // Clean history when document generation ends
  useEffect(() => {
    if (!isGenerating && editor) {
      const current = editor.getHTML();
      if (current && current !== "<p></p>") {
        clearEditorHistory(editor);
      }
      setContentVersion(prev => prev + 1);
    }
  }, [isGenerating, editor]);

  // Listen for storage update event (real-time stream)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!editor) return;

    const handleStorageUpdate = () => {
      const draft = localStorage.getItem("extrajus_draft") || "";
      const cleaned = cleanMarkdownBold(draft);
      if (editor.getHTML() !== cleaned) {
        editor.commands.setContent(cleaned, { emitUpdate: false });
        if (typeof (editor.commands as any).clearHistory === "function") {
          (editor.commands as any).clearHistory();
        }
      }
      setContentVersion(prev => prev + 1);
    };

    window.addEventListener("storage_extrajus_draft", handleStorageUpdate);
    return () => {
      window.removeEventListener("storage_extrajus_draft", handleStorageUpdate);
    };
  }, [editor]);

  // Watch for external editable changes
  useEffect(() => {
    if (editor) {
      const targetEditable = editable && !isRewriting;
      if (editor.isEditable !== targetEditable) {
        editor.setEditable(targetEditable);
      }
    }
  }, [editor, editable, isRewriting]);

  const hasMarks = React.useMemo(() => {
    if (!editor) return false;
    return editor.getHTML().includes("<mark");
  }, [editor, contentVersion]);

  useEffect(() => {
    onActiveEditChange?.(hasMarks);
  }, [hasMarks, onActiveEditChange]);

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  const [toolbarHeight, setToolbarHeight] = useState(0)

  useEffect(() => {
    if (toolbarRef.current) {
      setToolbarHeight(toolbarRef.current.getBoundingClientRect().height)
    }
  }, [])

  // Don't render cursor visibility logic if not editable
  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarHeight,
  })



  const handleOrbiRewrite = async (externalInstruction?: string) => {
    if (!editor) return;
    
    // Sempre pegamos o documento todo para garantir que a IA localize o contexto certo e aplique o diff mark
    const contextText = editor.getHTML();
    setPreAiEditContent(contextText);

    const { from, to } = editor.state.selection;
    const selectedText = from !== to ? editor.state.doc.textBetween(from, to, " ") : "";

    const instruction = externalInstruction || window.prompt("O que você quer mudar neste documento?");
    if (!instruction) return;

    setIsRewriting(true);

    try {
      const response = await fetch("/api/gemini/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: contextText, 
          instruction,
          selectedText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha na reescrita");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullHtml = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullHtml += chunk;
        }

        const cleanHtml = fullHtml.replace(/^```html\s*/i, '').replace(/```$/i, '');
        const cleaned = cleanMarkdownBold(cleanHtml);

        const parser = new DOMParser();
        const responseDoc = parser.parseFromString(cleaned, "text/html");
        const updates = Array.from(responseDoc.querySelectorAll('update'));
        
        if (updates.length > 0) {
          const currentHtml = editor.getHTML();
          const currentDoc = parser.parseFromString(currentHtml, "text/html");
          
          let modified = false;
          updates.forEach(updateTag => {
            const id = updateTag.getAttribute('id');
            if (!id) return;
            
            const targetNode = currentDoc.querySelector(`[id="${id}"]`);
            if (targetNode) {
              if (updateTag.firstElementChild && updateTag.firstElementChild.getAttribute('id') === id) {
                targetNode.replaceWith(updateTag.firstElementChild.cloneNode(true));
              } else {
                targetNode.innerHTML = updateTag.innerHTML;
              }
              modified = true;
            }
          });
          
          if (modified) {
            const finalHtml = currentDoc.body.innerHTML;
            editor.commands.setContent(finalHtml);
            localStorage.setItem("extrajus_draft", finalHtml);
          }
        } else {
          // Fallback se a IA não usar tags <update> (retornar o doc inteiro)
          if (cleaned.length > 50 && !cleaned.includes('<update')) {
            editor.commands.setContent(cleaned);
            localStorage.setItem("extrajus_draft", cleaned);
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao reescrever o texto.");
    } finally {
      setIsRewriting(false);
    }
  };

  const clearHighlights = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const cleanHtml = html.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, "$1");
    editor.commands.setContent(cleanHtml);
    localStorage.setItem("extrajus_draft", cleanHtml);
    setPreAiEditContent(null);
  };

  const undoAiEdit = () => {
    if (!editor || !preAiEditContent) return;
    editor.commands.setContent(preAiEditContent);
    localStorage.setItem("extrajus_draft", preAiEditContent);
    setPreAiEditContent(null);
  };

  useImperativeHandle(ref, () => ({
    handleOrbiRewrite
  }));

  return (
    <div className="simple-editor-wrapper" style={{ 
      position: "relative", 
      opacity: lockHeight === "350vh" ? 0 : 1, 
      transition: "opacity 0.3s ease-in" 
    }}>

      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          className="simple-editor-toolbar w-full flex items-center justify-center gap-1"
          style={{
            display: "flex",
            alignItems: "center",
            background: "color-mix(in srgb, var(--surface) 85%, transparent)",
            borderBottom: "1px solid var(--border)",
            paddingTop: "12px",
            paddingBottom: "12px",
            paddingLeft: isMobile === true ? "24px" : "24px",
            paddingRight: isMobile === true ? "24px" : "24px",
            position: isMobile === true ? "fixed" : "sticky",
            top: 0,
            ...(isMobile === true ? { left: 0, right: 0 } : {}),
            zIndex: 100,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxSizing: "border-box",
            borderRadius: 0,
          }}
        >
          {isMobile === undefined ? null : (
            mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
                leftContent={leftContent}
                rightContent={rightContent}
                disabled={!editable || isRewriting}
                editor={editor}
                clearHighlights={clearHighlights}
                isUndoDisabled={isUndoDisabled}
                fontSize={fontSize}
                increaseFontSize={increaseFontSize}
                decreaseFontSize={decreaseFontSize}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )
          )}
        </Toolbar>

        {/* Floating Snackbar for AI Edits */}
        {editor && editor.getHTML().includes("<mark") && (
          <div style={{
            position: "fixed",
            bottom: "80px", /* Floats directly above the input bar */
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            padding: "5px 8px 5px 12px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
            width: "max-content",
            maxWidth: "90vw",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
              <span style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600 }}>Revisão da IA:</span>
            </div>

            {preAiEditContent && (
              <button
                onClick={undoAiEdit}
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                  e.currentTarget.style.transform = "translateY(-0.5px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Descartar
              </button>
            )}
            
            <button
              onClick={clearHighlights}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                padding: "5px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.08)";
                e.currentTarget.style.transform = "translateY(-0.5px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.2)";
              }}
            >
              Aceitar
            </button>
          </div>
        )}

        <div 
          className="simple-editor-content" 
          style={{ 
            position: "relative",
            ["--editor-font-size" as keyof React.CSSProperties]: `${fontSize}px`,
            userSelect: editable ? "text" : "none",
            WebkitUserSelect: editable ? "text" : "none",
            MozUserSelect: editable ? "text" : "none",
            msUserSelect: editable ? "text" : "none",
          }}
        >
          <div style={{
            overflow: "visible",
          }}>
            <EditorContent
              editor={editor}
              role="presentation"
              className="simple-editor-content-inner"
            />
          </div>
          {children}
        </div>
      </EditorContext.Provider>
    </div>
  );
});

SimpleEditor.displayName = "SimpleEditor";
