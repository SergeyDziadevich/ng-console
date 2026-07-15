import type { Meta, StoryObj } from '@storybook/angular';
import { Toast } from './toast';

const meta: Meta<Toast> = {
  component: Toast,
  title: 'Toast',
};
export default meta;

type Story = StoryObj<Toast>;

export const Primary: Story = {
  args: {},
};
