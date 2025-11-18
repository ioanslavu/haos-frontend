import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { MentionList, MentionListRef } from './MentionList';
import { useDepartmentUsers } from '@/api/hooks/useUsers';
import { SuggestionOptions } from '@tiptap/suggestion';

export const getSuggestion = (): Omit<SuggestionOptions, 'editor'> => ({
  items: async ({ query }) => {
    // Minimum 2 characters to search
    if (query.length < 2) {
      return [];
    }

    // This will be called by TipTap, but we handle the actual search in MentionList
    // Return empty array here and let MentionList handle the API call
    return [];
  },

  render: () => {
    let component: ReactRenderer<MentionListRef> | undefined;
    let popup: TippyInstance[] | undefined;

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as any,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          maxWidth: 'none',
          zIndex: 9999,
          onCreate(instance) {
            // Ensure the popup can receive pointer events
            if (instance.popper) {
              instance.popper.style.pointerEvents = 'auto';
            }
          },
        });
      },

      onUpdate(props) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as any,
        });
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }

        // Forward keyboard events to MentionList component
        return component?.ref?.onKeyDown(props.event) ?? false;
      },

      onExit() {
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },

  char: '@',
  allowSpaces: false,
  startOfLine: false,
});
