import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ModeTabs } from './ModeTabs'
import { AllTheProviders } from '@/__test__/test-utils'

describe('ModeTabs', () => {
  it('renders all three tabs', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Dimensions → Stitches\/Rows/)).toBeInTheDocument()
    expect(screen.getByText(/Stitches\/Rows → Dimensions/)).toBeInTheDocument()
    expect(screen.getByText(/Pattern Rescale/)).toBeInTheDocument()
  })

  it('marks active tab with aria-selected', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    const buttons = screen.getAllByRole('tab')
    expect(buttons[0]).toHaveAttribute('aria-selected', 'true')
    expect(buttons[1]).toHaveAttribute('aria-selected', 'false')
    expect(buttons[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onModeChange when clicking a tab', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    const tabs = screen.getAllByRole('tab')
    fireEvent.click(tabs[1])

    expect(handleModeChange).toHaveBeenCalledWith('countsToDim')
  })

  it('navigates forward with ArrowRight', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    const activeTab = screen.getByRole('tab', { selected: true })
    activeTab.focus()
    fireEvent.keyDown(activeTab, { key: 'ArrowRight' })

    expect(handleModeChange).toHaveBeenCalledWith('countsToDim')
  })

  it('wraps around when navigating forward from last tab', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="patternRescale" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    const activeTab = screen.getByRole('tab', { selected: true })
    activeTab.focus()
    fireEvent.keyDown(activeTab, { key: 'ArrowRight' })

    expect(handleModeChange).toHaveBeenCalledWith('dimToCounts')
  })

  it('navigates backward with ArrowLeft', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="countsToDim" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    const activeTab = screen.getByRole('tab', { selected: true })
    activeTab.focus()
    fireEvent.keyDown(activeTab, { key: 'ArrowLeft' })

    expect(handleModeChange).toHaveBeenCalledWith('dimToCounts')
  })

  it('wraps around when navigating backward from first tab', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    const activeTab = screen.getByRole('tab', { selected: true })
    activeTab.focus()
    fireEvent.keyDown(activeTab, { key: 'ArrowLeft' })

    expect(handleModeChange).toHaveBeenCalledWith('patternRescale')
  })

  it('ignores other keys', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'Enter' })

    expect(handleModeChange).not.toHaveBeenCalled()
  })

  it('shows sun accent underline on active tab', () => {
    const handleModeChange = vi.fn()

    const { rerender } = render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    const buttons = screen.getAllByRole('tab')
    const activeTab = buttons[0]
    const underline = activeTab.querySelector('span')

    expect(underline).toHaveClass('bg-accent-sun')

    rerender(
      <ModeTabs mode="countsToDim" onModeChange={handleModeChange} />
    )

    const newButtons = screen.getAllByRole('tab')
    const newActiveTab = newButtons[1]
    const newUnderline = newActiveTab.querySelector('span')

    expect(newUnderline).toHaveClass('bg-accent-sun')
  })

  it('renders in english (en locale)', () => {
    const handleModeChange = vi.fn()

    render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Dimensions → Stitches\/Rows/)).toBeInTheDocument()
    expect(screen.getByText(/Stitches\/Rows → Dimensions/)).toBeInTheDocument()
    expect(screen.getByText(/Pattern Rescale/)).toBeInTheDocument()
  })

  it('updates tab selection when mode prop changes', () => {
    const handleModeChange = vi.fn()

    const { rerender } = render(
      <ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />,
      { wrapper: AllTheProviders }
    )

    let buttons = screen.getAllByRole('tab')
    expect(buttons[0]).toHaveAttribute('aria-selected', 'true')

    rerender(
      <ModeTabs mode="countsToDim" onModeChange={handleModeChange} />
    )

    buttons = screen.getAllByRole('tab')
    expect(buttons[1]).toHaveAttribute('aria-selected', 'true')
  })
})


describe('ModeTabs — roving tabindex (WAI-ARIA tabs pattern)', () => {
  it('only the focused tab is a tab stop; others are tabIndex -1', () => {
    const handleModeChange = vi.fn()
    render(<ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />, {
      wrapper: AllTheProviders,
    })

    const tabs = screen.getAllByRole('tab')
    const stops = tabs.map((t) => t.tabIndex)
    expect(stops.filter((i) => i === 0)).toHaveLength(1)
    expect(stops.filter((i) => i === -1)).toHaveLength(2)
  })

  it('every tab has aria-controls pointing at the tabpanel id', () => {
    const handleModeChange = vi.fn()
    render(<ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />, {
      wrapper: AllTheProviders,
    })

    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveAttribute('aria-controls', 'kg-tabpanel')
      expect(tab.id).toMatch(/^kg-tab-/)
    }
  })

  it('ArrowRight moves DOM focus to the newly selected tab', () => {
    const handleModeChange = vi.fn()
    render(<ModeTabs mode="dimToCounts" onModeChange={handleModeChange} />, {
      wrapper: AllTheProviders,
    })

    const tabs = screen.getAllByRole('tab')
    tabs[0].focus()
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })

    expect(handleModeChange).toHaveBeenCalledWith('countsToDim')
    expect(document.activeElement).toBe(tabs[1])
  })
})
