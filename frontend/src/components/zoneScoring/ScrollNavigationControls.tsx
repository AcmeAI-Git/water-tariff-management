import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ScoringParam } from '../../../types';

interface ScrollNavigationControlsProps {
  tableScrollRef: React.RefObject<HTMLDivElement>;
  calculatedParams: ScoringParam[];
}

export function ScrollNavigationControls({ tableScrollRef, calculatedParams }: ScrollNavigationControlsProps) {
  const [scrollPosition, setScrollPosition] = useState({ left: 0, maxScroll: 0, canScrollLeft: false, canScrollRight: false });

  useEffect(() => {
    const tableScroll = tableScrollRef.current;
    if (!tableScroll) return;

    const updateScrollInfo = () => {
      const scrollLeft = tableScroll.scrollLeft;
      const scrollWidth = tableScroll.scrollWidth;
      const clientWidth = tableScroll.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      
      setScrollPosition({
        left: scrollLeft,
        maxScroll,
        canScrollLeft: scrollLeft > 0,
        canScrollRight: scrollLeft < maxScroll - 1,
      });
    };

    const handleScroll = () => {
      updateScrollInfo();
    };

    const handleResize = () => {
      updateScrollInfo();
    };

    const timeoutId = setTimeout(updateScrollInfo, 100);
    
    tableScroll.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    const table = tableScroll.querySelector('table');
    let resizeObserver: ResizeObserver | null = null;
    
    if (table) {
      resizeObserver = new ResizeObserver(() => {
        updateScrollInfo();
      });
      resizeObserver.observe(table);
    }
    
    return () => {
      tableScroll.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearTimeout(timeoutId);
    };
  }, [tableScrollRef, calculatedParams]);

  const scrollTable = (direction: 'left' | 'right', amount: number = 300) => {
    const tableScroll = tableScrollRef.current;
    if (!tableScroll) return;
    
    const currentScroll = tableScroll.scrollLeft;
    const newScroll = direction === 'left' 
      ? Math.max(0, currentScroll - amount)
      : Math.min(tableScroll.scrollWidth - tableScroll.clientWidth, currentScroll + amount);
    
    tableScroll.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  if (scrollPosition.maxScroll <= 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 mb-3 px-1">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrollTable('left')}
          disabled={!scrollPosition.canScrollLeft}
          className="h-9 px-3 border-gray-300 disabled:opacity-50"
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrollTable('right')}
          disabled={!scrollPosition.canScrollRight}
          className="h-9 px-3 border-gray-300 disabled:opacity-50"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-2">
        <span>
          {Math.round((scrollPosition.left / Math.max(scrollPosition.maxScroll, 1)) * 100)}% scrolled
        </span>
      </div>
    </div>
  );
}
