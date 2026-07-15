import type { Meta, StoryObj } from '@storybook/angular';
import { CommandPaletteComponent } from './command-palette';

const meta: Meta<CommandPaletteComponent> = {
  component: CommandPaletteComponent,
  title: 'CommandPaletteComponent',
};
export default meta;

type Story = StoryObj<CommandPaletteComponent>;

export const Primary: Story = {
  args: {},
};
