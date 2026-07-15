import type { Meta, StoryObj } from '@storybook/angular';
import { SvgIconComponent } from './svg-icon.component';

const meta: Meta<SvgIconComponent> = {
  component: SvgIconComponent,
  title: 'SvgIconComponent',
};
export default meta;

type Story = StoryObj<SvgIconComponent>;

export const Primary: Story = {
  args: {
    customClass: 'h-4 w-4',
  },
};
