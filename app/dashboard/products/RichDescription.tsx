'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import YoutubeExtension from '@tiptap/extension-youtube';
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Image, Link as LinkIcon, Youtube, Video, X,
} from 'lucide-react';

interface RichDescriptionProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const toolbarBtn = (active = false): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  border: '1px solid var(--sell-border)',
  borderRadius: 6,
  background: active ? 'var(--sell-primary-lt)' : 'var(--sell-surface)',
  color: active ? 'var(--sell-primary)' : 'var(--sell-text-2)',
  cursor: 'pointer',
  fontSize: 14,
  padding: 0,
  transition: 'all 0.15s',
});

export function RichDescription({ value, onChange, placeholder }: RichDescriptionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const isExternalUpdate = useRef(false);
  const [uploading, setUploading] = React.useState<'image' | 'video' | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      UnderlineExtension,
      ImageExtension.configure({ allowBase64: false }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Describe the product — materials, key features, who it\'s for…' }),
      YoutubeExtension.configure({ width: 480, height: 320 }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      if (isExternalUpdate.current) {
        isExternalUpdate.current = false;
        return;
      }
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-description-editor',
        style: 'min-height: 140px; outline: none; padding: 12px; font-size: 0.875rem; line-height: 1.6; color: var(--sell-text-1);',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      isExternalUpdate.current = true;
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    if (!file.type.startsWith('image/')) {
      notify('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('Image is too large. Max 10MB.');
      return;
    }
    setUploading('image');
    try {
      const { getStorage } = await import('@/lib/storage/adapter');
      const storage = getStorage();
      const path = `product-descriptions/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const url = await storage.upload(file, path);
      editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, '') }).run();
    } catch (error) {
      console.error('Image upload failed:', error);
      notify('Image upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  }, [editor, notify]);

  const handleVideoUpload = useCallback(async (file: File) => {
    if (!editor) return;
    if (!file.type.startsWith('video/')) {
      notify('Please choose a video file (MP4, WebM, MOV, etc).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      notify('Video is too large. Max 50MB.');
      return;
    }
    setUploading('video');
    try {
      const { getStorage } = await import('@/lib/storage/adapter');
      const storage = getStorage();
      const path = `product-descriptions/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const url = await storage.upload(file, path);
      editor.chain().focus().insertContent(`<video src="${url}" controls playsinline></video>`).run();
    } catch (error) {
      console.error('Video upload failed:', error);
      notify('Video upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  }, [editor, notify]);

  const handleVideoEmbed = useCallback(() => {
    if (!editor) return;
    const url = (window.prompt('Paste a YouTube, Vimeo or direct video link:') || '').trim();
    if (!url) return;

    // YouTube → native TipTap youtube embed
    if (/youtube\.com|youtu\.be/.test(url)) {
      const ok = editor.chain().focus().setYoutubeVideo({ src: url }).run();
      if (ok) return;
    }

    // Vimeo → generic iframe embed
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      editor.chain().focus()
        .insertContent(`<div data-video-embed><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`)
        .run();
      return;
    }

    // Direct link to a video file → native <video>
    if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)) {
      editor.chain().focus().insertContent(`<video src="${url}" controls playsinline></video>`).run();
      return;
    }

    // Fall back to a regular link
    editor.chain().focus().setLink({ href: url }).run();
    notify('Added as a link. Tip: use a YouTube/Vimeo link to embed a playable video.');
  }, [editor, notify]);

  const handleAddLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string || '';
    const url = window.prompt('Enter URL:', previousUrl);
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div style={{
      border: '1.5px solid var(--sell-border)',
      borderRadius: 'var(--sell-radius-sm)',
      overflow: 'hidden',
      background: 'var(--sell-bg)',
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '6px 8px',
        borderBottom: '1px solid var(--sell-border)',
        background: 'var(--sell-surface)',
        alignItems: 'center',
      }}>
        <button style={toolbarBtn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={15} /></button>
        <button style={toolbarBtn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={15} /></button>
        <button style={toolbarBtn(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><Underline size={15} /></button>
        <span style={{ width: 1, height: 20, background: 'var(--sell-border)', margin: '0 4px' }} />
        <button style={toolbarBtn(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={15} /></button>
        <button style={toolbarBtn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={15} /></button>
        <span style={{ width: 1, height: 20, background: 'var(--sell-border)', margin: '0 4px' }} />
        <button style={toolbarBtn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={15} /></button>
        <button style={toolbarBtn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered size={15} /></button>
        <span style={{ width: 1, height: 20, background: 'var(--sell-border)', margin: '0 4px' }} />
        <button style={toolbarBtn(editor.isActive('link'))} onClick={handleAddLink} title="Add Link"><LinkIcon size={15} /></button>
        <button style={{ ...toolbarBtn(), position: 'relative' }} onClick={() => fileInputRef.current?.click()} disabled={uploading !== null} title="Upload Image">
          {uploading === 'image' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15, animation: 'spin 0.7s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          ) : <Image size={15} />}
        </button>
        <button style={toolbarBtn()} onClick={handleVideoEmbed} title="Embed Video (YouTube / Vimeo / link)"><Youtube size={15} /></button>
        <button style={{ ...toolbarBtn(), position: 'relative' }} onClick={() => videoFileInputRef.current?.click()} disabled={uploading !== null} title="Upload Video (MP4, WebM, etc.)">
          {uploading === 'video' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15, animation: 'spin 0.7s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          ) : <Video size={15} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = '';
          }}
        />
        <input
          ref={videoFileInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleVideoUpload(file);
            e.target.value = '';
          }}
        />
      </div>
      {notice && (
        <div style={{
          margin: '6px 8px', padding: '6px 10px', borderRadius: 6,
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)',
          color: '#B45309', fontSize: '0.75rem',
        }}>
          ⚠️ {notice}
        </div>
      )}
      <EditorContent editor={editor} />
      <style>{`
        .rich-description-editor p { margin: 0 0 8px; }
        .rich-description-editor h1 { font-size: 1.3rem; font-weight: 700; margin: 0 0 8px; }
        .rich-description-editor h2 { font-size: 1.1rem; font-weight: 600; margin: 0 0 8px; }
        .rich-description-editor ul, .rich-description-editor ol { margin: 0 0 8px; padding-left: 20px; }
        .rich-description-editor li { margin-bottom: 4px; }
        .rich-description-editor img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
        .rich-description-editor video { max-width: 100%; border-radius: 8px; margin: 8px 0; background: #000; }
        .rich-description-editor [data-youtube-video], .rich-description-editor [data-video-embed] {
          position: relative; width: 100%; padding-top: 56.25%; height: 0; margin: 8px 0; background: #000; border-radius: 8px; overflow: hidden;
        }
        .rich-description-editor [data-youtube-video] iframe, .rich-description-editor [data-video-embed] iframe {
          position: absolute; inset: 0; width: 100%; height: 100%; border: 0;
        }
        .rich-description-editor a { color: var(--sell-primary); text-decoration: underline; }
        .rich-description-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--sell-text-3);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
