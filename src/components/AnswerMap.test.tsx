import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { PROMPTS } from '../lib/daily';
import { AnswerMap } from './AnswerMap';

describe('AnswerMap', () => {
  it('lights valid elements, dims the rest, rings the pick and the Mole answer', () => {
    const p = PROMPTS.find((x) => x.id === 'liquid-near-rt')!;
    const { container } = render(<AnswerMap prompt={p} pickedZ={80} />);
    const lit = container.querySelectorAll('.pt-tile.lit');
    expect(lit).toHaveLength(p.validZ.length + (p.edge?.length ?? 0));
    expect(container.querySelectorAll('.pt-tile.dim')).toHaveLength(118 - lit.length);
    expect(container.querySelector('.picked')!.textContent).toContain('Hg');
    expect(container.querySelector('.mole-ring')!.textContent).toContain('Rb');
    expect(container.querySelectorAll('.edge')).toHaveLength(2);
    fireEvent.click(container.querySelector('.mole-ring')!);
    expect(container.textContent).toContain('Rubidium melts at 39.3 °C');
  });

  it('ignores taps on elements that don’t count', () => {
    const p = PROMPTS.find((x) => x.id === 'liquid-near-rt')!;
    const { container } = render(<AnswerMap prompt={p} pickedZ={null} />);
    fireEvent.click(container.querySelector('.pt-tile.dim')!);
    expect(container.querySelector('.am-hint')).toBeTruthy();
  });
});
