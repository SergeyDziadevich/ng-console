import type { Meta, StoryObj } from '@storybook/angular';
import { ConfirmDialogComponent } from './confirm-dialog.component';

const meta: Meta<ConfirmDialogComponent> = {
  component: ConfirmDialogComponent,
  title: 'ConfirmDialogComponent',
};
export default meta;

type Story = StoryObj<ConfirmDialogComponent>;

export const Primary: Story = {
  args: {},
};
