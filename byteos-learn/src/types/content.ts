/**
 * ByteOS — Rich module content and modality variant types
 * Used by Learn for rendering; Studio uses the same shapes when writing content Json.
 */

/** Legacy module content (unchanged) */
export interface TextContent {
  type: 'text'
  body: string
}

/** Section within rich content */
export interface RichContentSection {
  heading: string
  content: string
  type?: 'text' | 'list' | 'code' | 'diagram'
  items?: string[]
  image?: { url: string; alt?: string; attribution?: string }
}

/** Interactive element in rich content */
export interface RichInteractiveElement {
  type: 'quiz' | 'expandable' | 'code-demo' | 'diagram' | 'video' | 'audio' | 'flashcard' | 'timeline' | 'flipcard' | 'hotspot' | 'matching' | 'tabs'
  data: Record<string, unknown>
}

/** Side card in rich content */
export interface RichSideCard {
  title: string
  content: string
  tips?: string[]
}

/** Rich module content (new) */
export interface RichContent {
  type: 'rich'
  introduction?: string
  sections: RichContentSection[]
  summary?: string
  interactiveElements?: RichInteractiveElement[]
  sideCard?: RichSideCard
}

/** Module content: either legacy text or rich */
export type ModuleContent = TextContent | RichContent

/** Type guard for rich content */
export function isRichContent(content: unknown): content is RichContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    (content as RichContent).type === 'rich' &&
    Array.isArray((content as RichContent).sections)
  )
}

/** Video scene for modality variant */
export interface VideoScene {
  sceneNumber: number
  title: string
  narration: string
  visuals?: string
  duration?: number
}

/** Podcast dialogue segment */
export interface DialogueSegment {
  speaker: 'host' | 'expert'
  text: string
}

/** Modality variants stored on module (or course) */
export interface ModalityVariants {
  video?: { scenes: VideoScene[] }
  podcast?: { dialogue: DialogueSegment[] }
}
