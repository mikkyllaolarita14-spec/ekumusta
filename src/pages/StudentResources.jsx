import { useState, useMemo } from "react";
import StudentLayout from "../components/StudentLayout";
import { getAllResources } from "../store/database";
import { EmptyState, SearchBox, Badge } from "../components/ui";
import { RESOURCE_CATEGORY } from "../components/statusMaps";
import Icon from "../components/Icon";

/**
 * Student-facing support resources.
 * Shows only ACTIVE resources published by the Guidance Office,
 * as simple approachable cards with expandable content.
 */
export default function StudentResources() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const active = useMemo(
    () => getAllResources().filter((r) => r.isActive),
    []
  );

  const categories = useMemo(() => {
    const present = [...new Set(active.map((r) => r.category))];
    return present.map((c) => ({
      key: c,
      label: RESOURCE_CATEGORY[c]?.label || c,
    }));
  }, [active]);

  const filtered = useMemo(() => {
    let result = [...active];
    if (category !== "all") {
      result = result.filter((r) => r.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    const isCrisisResource = (r) => {
      const text = `${r.title || ""} ${r.description || ""} ${r.content || ""}`.toLowerCase();
      return (
        text.includes("crisis") ||
        text.includes("hotline") ||
        text.includes("emergency") ||
        text.includes("urgent help")
      );
    };
    return result.sort((a, b) => (isCrisisResource(a) ? -1 : 0) - (isCrisisResource(b) ? -1 : 0));
  }, [active, category, search]);

  return (
    <StudentLayout>
      <div className="admin-page-header">
        <div>
          <h2>Support Resources</h2>
          <p>Helpful materials from the Guidance Office — here whenever you need them.</p>
        </div>
      </div>

      <div className="admin-filters">
        <SearchBox
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources…"
          label="Search resources"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="admin-filter-select"
          aria-label="Filter by category"
        >
          <option value="all">All</option>
          {categories.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          kind={search || category !== "all" ? "results" : "data"}
          title={search || category !== "all" ? "No matching resources" : "No resources available yet"}
          message={
            search || category !== "all"
              ? "Try a different search term or category."
              : "The Guidance Office hasn't published any resources yet."
          }
        />
      ) : (
        <div className="ek-resource-grid">
          {filtered.map((r) => {
            const crisisText = `${r.title || ""} ${r.description || ""} ${r.content || ""}`.toLowerCase();
            const isCrisis =
              crisisText.includes("crisis") ||
              crisisText.includes("hotline") ||
              crisisText.includes("emergency") ||
              crisisText.includes("urgent help");
            const isOpen = expandedId === r.id;
            return (
              <div key={r.id} className={`ek-resource-card ${isCrisis ? "ek-resource-emergency" : ""}`}>
                <div className="ek-resource-top">
                  <Badge tone={isCrisis ? "danger" : "info"}>
                    {RESOURCE_CATEGORY[r.category]?.label || r.category}
                  </Badge>
                  {isCrisis && <Icon name="phone" size={16} />}
                </div>
                <h3 className="ek-resource-title">{r.title}</h3>
                <p className="ek-resource-desc">{r.description}</p>
                {isOpen && <pre className="ek-resource-content">{r.content}</pre>}
                <button
                  className="admin-btn admin-btn-sm admin-btn-outline"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? "Show Less" : "View Details"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
