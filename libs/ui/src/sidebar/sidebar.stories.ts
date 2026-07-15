import type { Meta, StoryObj } from '@storybook/angular';
import { Sidebar } from './sidebar';

const meta: Meta<Sidebar> = {
  component: Sidebar,
  title: 'Sidebar',
};
export default meta;

type Story = StoryObj<Sidebar>;

export const Primary: Story = {
  args: {},
};
