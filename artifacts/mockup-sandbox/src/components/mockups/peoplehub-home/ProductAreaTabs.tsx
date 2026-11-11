import { useId, useState, type KeyboardEvent } from "react";
import "./ProductAreaTabs.css";

export type ProductAreaTabItem = {
  key: string;
  name: string;
};

type ProductAreaTabsProps = {
  items?: ProductAreaTabItem[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  idPrefix?: string;
  panelId?: string;
  ariaLabel?: string;
};

const previewItems: ProductAreaTabItem[] = [
  { key: "core-hrms", name: "Core HRMS" },
  { key: "time", name: "Time & Workforce" },
  { key: "payroll", name: "Payroll & Compliance" },
  { key: "recruitment", name: "Recruitment & ATS" },
  { key: "talent", name: "Performance & Talent" },
];

export function ProductAreaTabs({
  items = previewItems,
  selectedKey,
  onSelect,
  idPrefix,
  panelId,
  ariaLabel = "Product areas",
}: ProductAreaTabsProps = {}) {
  const reactId = useId().replace(/:/g, "");
  const tabIdPrefix = idPrefix ?? `product-area-${reactId}`;
  const [internalKey, setInternalKey] = useState(items[0]?.key ?? "");
  const activeKey = selectedKey ?? internalKey;
  const activeIndex = Math.max(0, items.findIndex((item) => item.key === activeKey));

  const selectItem = (index: number) => {
    const item = items[index];
    if (!item) return;
    if (selectedKey === undefined) setInternalKey(item.key);
    onSelect?.(item.key);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    if (nextIndex === undefined || items.length === 0) return;
    event.preventDefault();
    selectItem(nextIndex);
    document.getElementById(`${tabIdPrefix}-tab-${items[nextIndex].key}`)?.focus();
  };

  return (
    <div className="peoplehub-area-tabs" role="tablist" aria-orientation="horizontal" aria-label={ariaLabel}>
      {items.map((item, index) => (
        <button
          key={item.key}
          type="button"
          className="peoplehub-area-tabs__tab"
          role="tab"
          id={`${tabIdPrefix}-tab-${item.key}`}
          aria-selected={activeIndex === index}
          aria-controls={panelId}
          tabIndex={activeIndex === index ? 0 : -1}
          onClick={() => selectItem(index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          <span className="peoplehub-area-tabs__label">{item.name}</span>
        </button>
      ))}
    </div>
  );
}
