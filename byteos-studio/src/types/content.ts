/**
 * ByteOS — Rich module content types (Studio)
 * Used when generating and writing module content Json; matches Learn content.ts.
 */

export interface TextContent {
  type: 'text'
  body: string
}

export interface RichContentSection {
  heading: string
  content: string
  type?: 'text' | 'list' | 'code' | 'diagram'
  items?: string[]
  image?: { url: string; alt?: string; attribution?: string }
}

export interface RichInteractiveElement {
  type: 'quiz' | 'expandable' | 'code-demo' | 'diagram' | 'video' | 'audio' | 'flashcard' | 'timeline' | 'flipcard' | 'hotspot' | 'matching' | 'tabs'
  data: Record<string, unknown>
}

export interface RichSideCard {
  title: string
  content: string
  tips?: string[]
}

export interface RichContent {
  type: 'rich'
  introduction?: string
  sections: RichContentSection[]
  summary?: string
  interactiveElements?: RichInteractiveElement[]
  sideCard?: RichSideCard
}

export type ModuleContent = TextContent | RichContent

export function isRichContent(content: unknown): content is RichContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    (content as RichContent).type === 'rich' &&
    Array.isArray((content as RichContent).sections)
  )
}

/** Editor block for block-based module editing (Studio). Stored as RichContent (sections + interactiveElements). */
export type EditorBlockType = 'text' | 'image' | 'expandable' | 'quiz' | 'video' | 'timeline' | 'flipcard' | 'hotspot' | 'matching' | 'tabs' | 'audio' | 'flashcard'

export interface EditorBlockBase {
  id: string
  type: EditorBlockType
}

export interface EditorBlockText extends EditorBlockBase {
  type: 'text'
  data: { content: string }
}

export interface EditorBlockImage extends EditorBlockBase {
  type: 'image'
  data: { url: string; alt?: string; attribution?: string }
}

export interface EditorBlockExpandable extends EditorBlockBase {
  type: 'expandable'
  data: { title: string; content: string }
}

export interface EditorBlockQuiz extends EditorBlockBase {
  type: 'quiz'
  data: { question?: string; options?: string[]; correctAnswer?: string; explanation?: string }
}

export interface EditorBlockVideo extends EditorBlockBase {
  type: 'video'
  data: { url: string; title?: string }
}

export interface EditorBlockTimeline extends EditorBlockBase {
  type: 'timeline'
  data: { steps: { title: string; description: string; icon?: string }[] }
}

export interface EditorBlockFlipcard extends EditorBlockBase {
  type: 'flipcard'
  data: { cards: { front: string; back: string }[] }
}

export interface EditorBlockHotspot extends EditorBlockBase {
  type: 'hotspot'
  data: { imageUrl: string; spots: { x: number; y: number; label: string; content: string }[] }
}

export interface EditorBlockMatching extends EditorBlockBase {
  type: 'matching'
  data: { pairs: { term: string; definition: string }[]; instruction?: string }
}

export interface EditorBlockTabs extends EditorBlockBase {
  type: 'tabs'
  data: { tabs: { label: string; content: string }[] }
}

export interface EditorBlockAudio extends EditorBlockBase {
  type: 'audio'
  data: { url: string; title?: string; transcript?: string }
}

export interface EditorBlockFlashcard extends EditorBlockBase {
  type: 'flashcard'
  data: { cards: { front: string; back: string }[] }
}

export type EditorBlock =
  | EditorBlockText
  | EditorBlockImage
  | EditorBlockExpandable
  | EditorBlockQuiz
  | EditorBlockVideo
  | EditorBlockTimeline
  | EditorBlockFlipcard
  | EditorBlockHotspot
  | EditorBlockMatching
  | EditorBlockTabs
  | EditorBlockAudio
  | EditorBlockFlashcard

export interface VideoScene {
  sceneNumber: number
  title: string
  narration: string
  visuals?: string
  duration?: number
}

export interface DialogueSegment {
  speaker: 'host' | 'expert'
  text: string
}

export interface ModalityVariants {
  video?: { scenes: VideoScene[] }
  podcast?: { dialogue: DialogueSegment[] }
}
