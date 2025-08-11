// find:
const [edit, setEdit] = useState(true);

// add:
const readOnly = useAppStore(s => s.readOnly);
const effectiveEdit = !readOnly && edit;

// then use effectiveEdit where you disable controls:
<select ... disabled={!effectiveEdit} ... />
<input ... disabled={!effectiveEdit} ... />

// and in the toggle label, show it's forced:
<label className="inline-flex items-center gap-2">
  <input type="checkbox" checked={effectiveEdit} onChange={(e)=> setEdit(e.target.checked)} disabled={readOnly}/>
  <span>Edit Mode {readOnly ? '(read-only link)' : ''}</span>
</label>
