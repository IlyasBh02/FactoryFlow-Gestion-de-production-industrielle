import { statuses } from "../utils/orders";

export function StatusBadge({ status }) {
    const label = statuses[status] || status;

    return <span className={"badge status-" + status}>{label}</span>;
}
