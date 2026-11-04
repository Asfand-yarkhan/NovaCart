import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { imageUrl } from '../../lib/assets';
import { useToast } from '../../context/ToastContext';
import { Drawer } from '../ui/Dialog';
import Field from '../ui/Field';
import SerpPreview from './SerpPreview';

const slugify = (v = '') => String(v).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const NEW_CAT = '__new__';

const toForm = (p) => ({
  name: p?.name || '',
  category: p?.category || '',
  newCategory: '',
  unit: p?.unit || '',
  origin: p?.origin || '',
  price: p?.price ?? '',
  compareAtPrice: p?.compareAtPrice ?? '',
  stock: p?.stock ?? '',
  featured: Boolean(p?.featured),
  description: p?.description || '',
  slug: p?.slug || '',
  metaTitle: p?.metaTitle || '',
  metaDescription: p?.metaDescription || '',
  metaKeywords: p?.metaKeywords || ''
});

function Counter({ value, min, max, hardMax }) {
  const n = value.length;
  const cls = n === 0 ? '' : n > hardMax ? 'is-over' : n >= min && n <= max ? 'is-good' : '';
  return <span className={`adm-counter ${cls}`} aria-live="polite">{n} / {min} to {max}</span>;
}

/**
 * Create / edit a product in a wide drawer.
 * product: null to create, an object to edit. categories: existing category names.
 */
export default function ProductDrawer({ open, product, categories, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !product?._id;
  const [form, setForm] = useState(() => toForm(product));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'name' && !slugTouched) next.slug = slugify(v);
      return next;
    });
    setErrors(er => ({ ...er, [k]: undefined }));
  };

  const pickFile = (f) => {
    if (!f) return;
    if (!/^image\/(jpe?g|png|webp|avif|gif)$/.test(f.type)) { setErrors(er => ({ ...er, image: 'Use a JPG, PNG, WebP or AVIF image' })); return; }
    if (f.size > 5 * 1024 * 1024) { setErrors(er => ({ ...er, image: 'Image must be 5 MB or smaller' })); return; }
    setErrors(er => ({ ...er, image: undefined }));
    setFile(f);
    setRemoveImage(false);
  };

  const category = form.category === NEW_CAT ? form.newCategory.trim() : form.category;

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Enter a product name';
    if (!category) er[form.category === NEW_CAT ? 'newCategory' : 'category'] = 'Choose or add a category';
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) er.price = 'Enter a price of 0 or more';
    if (form.compareAtPrice !== '' && Number(form.compareAtPrice) <= Number(form.price)) er.compareAtPrice = 'Must be higher than the price, or leave empty';
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) er.stock = 'Enter a whole number of 0 or more';
    if (form.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) er.slug = 'Use lowercase letters, numbers and hyphens';
    if (form.metaTitle.length > 70) er.metaTitle = 'Keep it to 70 characters or fewer';
    if (form.metaDescription.length > 200) er.metaDescription = 'Keep it to 200 characters or fewer';
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    setFormError('');
    if (Object.keys(er).length) { setFormError('Check the highlighted fields.'); return; }

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('category', category);
    ['unit', 'origin', 'description', 'metaTitle', 'metaDescription', 'metaKeywords'].forEach(k => fd.append(k, form[k].trim()));
    fd.append('slug', form.slug || slugify(form.name));
    fd.append('price', String(form.price));
    fd.append('compareAtPrice', form.compareAtPrice === '' ? '' : String(form.compareAtPrice));
    fd.append('stock', String(form.stock));
    fd.append('featured', form.featured ? 'true' : 'false');
    if (file) fd.append('image', file);
    if (removeImage && !file) fd.append('removeImage', 'true');

    setBusy(true);
    try {
      const saved = await api(isNew ? '/products' : `/products/${product._id}`, { method: isNew ? 'POST' : 'PUT', body: fd });
      toast.success(isNew ? `${saved.name} added to the catalogue` : `${saved.name} saved`);
      onSaved(saved, isNew);
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const currentImage = preview || (!removeImage && product?.image ? imageUrl(product.image) : '');
  const serpTitle = form.metaTitle || (form.name ? `${form.name} | NovaCart` : '');
  const serpDesc = form.metaDescription || form.description;

  return (
    <Drawer
      open={open}
      onClose={busy ? () => {} : onClose}
      labelId="adm-product-title"
      title={isNew ? 'Add product' : `Edit ${product.name}`}
      footer={
        <div className="adm-form-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="adm-product-form" className="btn btn-primary" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {isNew ? 'Add product' : 'Save changes'}
          </button>
        </div>
      }
    >
      <form id="adm-product-form" className="adm-form" onSubmit={submit} noValidate>
        {formError && (
          <div className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /><span>{formError}</span></div>
        )}

        <section className="adm-form-section">
          <h3>Basics</h3>
          <Field label="Product name" error={errors.name}>
            <input className="input" value={form.name} onChange={set('name')} maxLength={120} data-autofocus />
          </Field>
          <div className="form-grid">
            <Field label="Category" error={errors.category}>
              <select className="select" value={form.category} onChange={set('category')}>
                <option value="">Choose a category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value={NEW_CAT}>New category…</option>
              </select>
            </Field>
            {form.category === NEW_CAT ? (
              <Field label="New category name" error={errors.newCategory}>
                <input className="input" value={form.newCategory} onChange={set('newCategory')} placeholder="Frozen" />
              </Field>
            ) : (
              <Field label="Unit" hint="Shown under the name, e.g. 1 kg or 12 pcs" error={errors.unit}>
                <input className="input" value={form.unit} onChange={set('unit')} placeholder="1 kg" />
              </Field>
            )}
            {form.category === NEW_CAT && (
              <Field label="Unit" hint="Shown under the name, e.g. 1 kg or 12 pcs" error={errors.unit}>
                <input className="input" value={form.unit} onChange={set('unit')} placeholder="1 kg" />
              </Field>
            )}
            <Field label="Origin" optional error={errors.origin}>
              <input className="input" value={form.origin} onChange={set('origin')} placeholder="Swat Valley" />
            </Field>
          </div>
          <Field label="Description" error={errors.description} hint="Shown on the product page. Two or three plain sentences work best.">
            <textarea className="textarea" rows={4} value={form.description} onChange={set('description')} />
          </Field>
        </section>

        <section className="adm-form-section">
          <h3>Price and stock</h3>
          <div className="grid-3">
            <Field label="Price" error={errors.price} prefix="Rs">
              <input className="input" type="number" inputMode="decimal" min="0" step="1" value={form.price} onChange={set('price')} />
            </Field>
            <Field label="Compare-at price" optional error={errors.compareAtPrice} hint="Shows a sale badge" prefix="Rs">
              <input className="input" type="number" inputMode="decimal" min="0" step="1" value={form.compareAtPrice} onChange={set('compareAtPrice')} />
            </Field>
            <Field label="Stock" error={errors.stock}>
              <input className="input" type="number" inputMode="numeric" min="0" step="1" value={form.stock} onChange={set('stock')} />
            </Field>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.featured} onChange={set('featured')} />
            Feature on the home page
          </label>
        </section>

        <section className="adm-form-section">
          <h3>Image</h3>
          <div
            className={`adm-drop${dragOver ? ' is-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
          >
            <div className="adm-drop-img">
              {currentImage ? <img src={currentImage} alt="" /> : <i className="fa-regular fa-image" aria-hidden="true" />}
            </div>
            <div className="adm-drop-body">
              <span>{file ? file.name : currentImage ? 'Drop a new image here to replace it' : 'Drop an image here, or choose a file'}</span>
              <span className="muted text-xs">Square images look best. JPG, PNG, WebP or AVIF up to 5 MB.</span>
              <div className="btns">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                  <i className="fa-solid fa-upload" aria-hidden="true" />{currentImage ? 'Replace' : 'Choose file'}
                </button>
                {currentImage && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setRemoveImage(true); if (fileRef.current) fileRef.current.value = ''; }}>
                    Remove
                  </button>
                )}
              </div>
              {errors.image && <span className="error-text"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{errors.image}</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" hidden onChange={e => pickFile(e.target.files?.[0])} />
          </div>
        </section>

        <section className="adm-form-section">
          <h3>Search engine listing</h3>
          <SerpPreview title={serpTitle} description={serpDesc} slug={form.slug} />
          <Field label="URL slug" error={errors.slug} hint={`novacart.pk/product/${form.slug || 'your-product'}`}>
            <input className="input" value={form.slug} onChange={e => { setSlugTouched(true); set('slug')(e); }}
              onBlur={() => setForm(f => ({ ...f, slug: slugify(f.slug) }))} />
          </Field>
          <Field label="Meta title" error={errors.metaTitle} labelAside={<Counter value={form.metaTitle} min={50} max={60} hardMax={70} />}
            hint="Leave empty to use the product name">
            <input className="input" value={form.metaTitle} onChange={set('metaTitle')} maxLength={70} />
          </Field>
          <Field label="Meta description" error={errors.metaDescription} labelAside={<Counter value={form.metaDescription} min={150} max={160} hardMax={200} />}
            hint="Leave empty to use the description">
            <textarea className="textarea" rows={3} value={form.metaDescription} onChange={set('metaDescription')} maxLength={200} />
          </Field>
          <Field label="Meta keywords" optional error={errors.metaKeywords} hint="Comma separated">
            <input className="input" value={form.metaKeywords} onChange={set('metaKeywords')} placeholder="mango, chaunsa, fresh fruit" />
          </Field>
        </section>
      </form>
    </Drawer>
  );
}
