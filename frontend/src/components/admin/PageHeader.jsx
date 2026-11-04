/** Admin page title row. <PageHeader title="Products" description="52 items" actions={<button/>} /> */
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="adm-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="adm-head-actions">{actions}</div>}
    </div>
  );
}
