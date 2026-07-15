import type { Meta, StoryObj } from '@storybook/angular';
import { TopBar } from './top-bar';

const meta: Meta<TopBar> = {
  component: TopBar,
  title: 'TopBar',
};
export default meta;

type Story = StoryObj<TopBar>;

export const Primary: Story = {
  args: {},
};
