import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { findSlashSuggestionMatch } from '@/lib/slash-suggestion-match';
import {
  filterSlashItems,
  runSlashInsert,
  type SlashCommandItem,
} from '@/lib/slash-command-items';

export const slashPluginKey = new PluginKey('velSlashCommand');

export type SlashMenuState = {
  query: string;
  range: { from: number; to: number };
  items: SlashCommandItem[];
  clientRect: (() => DOMRect | null) | null;
  command: (item: SlashCommandItem) => void;
};

/**
 * Suggestion on `/` with the same range rules as the legacy `getSlashCommandState` helper.
 */
export const SlashCommandBridge = Extension.create<{
  onMenu: (state: SlashMenuState | null) => void;
  onKeyDown: (p: SuggestionKeyDownProps) => boolean;
}>({
  name: 'slashCommandBridge',
  addOptions() {
    return {
      onMenu: (_s: SlashMenuState | null) => {},
      onKeyDown: (_p: SuggestionKeyDownProps) => false,
    };
  },
  addProseMirrorPlugins() {
    const { onMenu, onKeyDown } = this.options;
    return [
      Suggestion<SlashCommandItem, SlashCommandItem>({
        editor: this.editor,
        pluginKey: slashPluginKey,
        char: '/',
        startOfLine: false,
        allowedPrefixes: null,
        allowSpaces: false,
        findSuggestionMatch: findSlashSuggestionMatch,
        allow: () => this.editor.isEditable,
        items: ({ query }) => filterSlashItems(query),
        command: ({ editor, range, props: item }) => {
          runSlashInsert(editor, range, item);
        },
        render: () => ({
          onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
            onMenu({
              query: props.query,
              range: props.range,
              items: props.items,
              clientRect: props.clientRect ?? null,
              command: (item) => {
                props.command(item);
              },
            });
          },
          onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
            onMenu({
              query: props.query,
              range: props.range,
              items: props.items,
              clientRect: props.clientRect ?? null,
              command: (item) => {
                props.command(item);
              },
            });
          },
          onExit: () => {
            onMenu(null);
          },
          onKeyDown: (p) => onKeyDown(p),
        }),
      }),
    ];
  },
});
