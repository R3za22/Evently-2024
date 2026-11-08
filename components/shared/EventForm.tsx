"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type Category, type EventDTO } from "@/lib/api";
import { eventSchema, fieldErrors, ValidationError, type EventInput } from "@/lib/validation";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/kit";
import EventImage from "@/components/shared/EventImage";
import { cn, toLocalInput } from "@/lib/utils";
import { useMe } from "@/lib/useMe";

type Values = {
  title: string;
  categoryId: string;
  description: string;
  location: string;
  imageUrl: string;
  startDateTime: string;
  endDateTime: string;
  price: string;
  isFree: boolean;
  url: string;
};

type FieldName = keyof Values;
type Errors = Record<string, string>;

/** DOM order, used to focus the first invalid field. */
const FIELD_ORDER: FieldName[] = ["title", "categoryId", "description", "imageUrl", "location", "startDateTime", "endDateTime", "price", "url"];

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

const without = (o: Errors, k: string): Errors => {
  const next = { ...o };
  delete next[k];
  return next;
};

function isValidationError(e: unknown): e is ValidationError {
  return e instanceof ValidationError || (typeof e === "object" && e !== null && "fields" in e && typeof (e as { fields: unknown }).fields === "object");
}

function defaultValues(): Values {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    title: "",
    categoryId: "",
    description: "",
    location: "",
    imageUrl: "",
    startDateTime: toLocalInput(start.toISOString()),
    endDateTime: toLocalInput(end.toISOString()),
    price: "",
    isFree: false,
    url: "",
  };
}

function valuesFromEvent(e: EventDTO): Values {
  return {
    title: e.title,
    categoryId: e.category?._id ?? "",
    description: e.description ?? "",
    location: e.location,
    imageUrl: e.imageUrl,
    startDateTime: toLocalInput(e.startDateTime),
    endDateTime: toLocalInput(e.endDateTime),
    price: e.isFree ? "" : e.price,
    isFree: e.isFree,
    url: e.url ?? "",
  };
}

/** Local datetime strings become ISO; unparseable input is passed through so the schema reports it. */
const isoOrRaw = (local: string) => {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? local : d.toISOString();
};

function toInput(v: Values): EventInput {
  return {
    title: v.title,
    description: v.description,
    location: v.location,
    imageUrl: v.imageUrl,
    startDateTime: isoOrRaw(v.startDateTime),
    endDateTime: isoOrRaw(v.endDateTime),
    categoryId: v.categoryId,
    price: v.isFree ? "" : v.price,
    isFree: v.isFree,
    url: v.url,
  };
}

/** Field -> message map for the whole form (empty when valid). */
function validate(v: Values): Errors {
  const r = eventSchema.safeParse(toInput(v));
  const out: Errors = r.success ? {} : { ...fieldErrors(r.error) };
  if (!v.startDateTime) out.startDateTime = "Choose a start date and time.";
  if (!v.endDateTime) out.endDateTime = "Choose an end date and time.";
  if (out.startDateTime === "Invalid date") out.startDateTime = "Enter a valid date and time.";
  if (out.endDateTime === "Invalid date") out.endDateTime = "Enter a valid date and time.";
  return out;
}

const describedBy = (id: string, error?: string, hasHint = false) => {
  const ids = [hasHint && !error ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
};

function Field({ id, label, error, hint, className, children }: { id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("field", className)}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-sm text-slate">{hint}</p>}
      {error && <p id={`${id}-error`} className="hint">{error}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 md:p-7">
      <h2 className="font-display text-[22px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Wrap({ children }: { children: ReactNode }) {
  return (
    <div className="wrapper py-10 md:py-14">
      <div className="flex max-w-[1000px] flex-col gap-8">{children}</div>
    </div>
  );
}

type BodyProps = {
  mode: "create" | "edit";
  eventId?: string;
  initial: Values;
  initialCategory?: Category;
};

function EventFormBody({ mode, eventId, initial, initialCategory }: BodyProps) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cats, setCats] = useState<Category[] | null>(null);
  const [catError, setCatError] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const [newCatError, setNewCatError] = useState<string | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});
  const reg = (name: FieldName) => (el: HTMLElement | null) => {
    fieldRefs.current[name] = el;
  };

  const loadCategories = useCallback(() => {
    setCatError(null);
    api
      .getCategories()
      .then(setCats)
      .catch((e) => setCatError(errMsg(e, "Couldn't load categories.")));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  /** Re-check the named fields. onlyShown: only touch fields that already show an error. */
  const revalidate = (next: Values, names: FieldName[], onlyShown: boolean) => {
    const all = validate(next);
    setErrors((prev) => {
      const out = { ...prev };
      for (const n of names) {
        if (onlyShown && !prev[n]) continue;
        if (all[n]) out[n] = all[n];
        else delete out[n];
      }
      return out;
    });
  };

  const change = (name: FieldName, value: string | boolean, also: FieldName[] = []) => {
    const next = { ...values, [name]: value } as Values;
    setValues(next);
    revalidate(next, [name, ...also], true);
  };

  const blur = (name: FieldName) => revalidate(values, [name], false);

  const focusFirst = (errs: Errors) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (!first) return false;
    fieldRefs.current[first]?.focus();
    return true;
  };

  const toggleFree = (checked: boolean) => {
    const next: Values = { ...values, isFree: checked, price: checked ? "" : values.price };
    setValues(next);
    revalidate(next, ["price"], true);
  };

  const onImagePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Choose an image file.");
      input.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await api.uploadImage(file);
      setValues((prev) => ({ ...prev, imageUrl: url }));
      setErrors((prev) => without(prev, "imageUrl"));
    } catch (err) {
      setUploadError(errMsg(err, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const removeImage = () => {
    setValues((prev) => ({ ...prev, imageUrl: "" }));
    setUploadError(null);
  };

  const addCategory = async () => {
    const name = newCat.trim();
    if (name.length < 2) {
      setNewCatError("Category name must be at least 2 characters.");
      return;
    }
    setAddingCat(true);
    setNewCatError(null);
    try {
      const c = await api.createCategory(name);
      setCats((prev) => [...(prev ?? []).filter((x) => x._id !== c._id), c]);
      setValues((prev) => ({ ...prev, categoryId: c._id }));
      setErrors((prev) => without(prev, "categoryId"));
      setNewCat("");
    } catch (err) {
      setNewCatError(errMsg(err, "Couldn't add the category. Try again."));
    } finally {
      setAddingCat(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving || uploading) return;
    setFormError(null);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (!focusFirst(errs)) setFormError(Object.values(errs)[0]);
      return;
    }
    setSaving(true);
    try {
      const input = toInput(values);
      const event = mode === "edit" && eventId ? await api.updateEvent(eventId, input) : await api.createEvent(input);
      router.push(`/events/view?id=${event._id}`);
    } catch (err) {
      setSaving(false);
      if (isValidationError(err)) {
        setErrors(err.fields);
        if (!focusFirst(err.fields)) setFormError(err.message);
      } else {
        setFormError(errMsg(err, "Something went wrong. Please try again."));
      }
    }
  };

  const categoryOptions = cats ?? [];
  const options =
    initialCategory && !categoryOptions.some((c) => c._id === initialCategory._id) ? [initialCategory, ...categoryOptions] : categoryOptions;
  const imageError = uploadError ?? errors.imageUrl;
  const cancelHref = mode === "edit" && eventId ? `/events/view?id=${eventId}` : "/";
  const isEdit = mode === "edit";

  return (
    <Wrap>
      <header className="flex flex-col gap-2.5">
        <p className="overline">Organiser · {isEdit ? "Edit event" : "Create event"}</p>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{isEdit ? "Edit your event" : "Create your event"}</h1>
      </header>

      {formError && <ErrorState title="Couldn't save your event" message={formError} />}

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6" aria-busy={saving || undefined}>
        <Panel title="Basics">
          <Field id="ev-title" label="Event title" error={errors.title}>
            <input
              id="ev-title"
              ref={reg("title")}
              type="text"
              autoComplete="off"
              placeholder="Event title"
              value={values.title}
              onChange={(e) => change("title", e.target.value)}
              onBlur={() => blur("title")}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={describedBy("ev-title", errors.title)}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field id="ev-category" label="Category" error={errors.categoryId}>
              <select
                id="ev-category"
                ref={reg("categoryId")}
                value={values.categoryId}
                disabled={cats === null && !catError}
                onChange={(e) => change("categoryId", e.target.value)}
                onBlur={() => blur("categoryId")}
                aria-invalid={errors.categoryId ? true : undefined}
                aria-describedby={describedBy("ev-category", errors.categoryId)}
              >
                <option value="">{cats === null && !catError ? "Loading categories…" : "Choose a category"}</option>
                {options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {catError && (
                <p className="hint">
                  {catError}{" "}
                  <button type="button" onClick={loadCategories} className="min-h-[44px] font-bold underline underline-offset-4">
                    Try again
                  </button>
                </p>
              )}
            </Field>

            <div className="field">
              <label htmlFor="ev-new-cat">New category name</label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="ev-new-cat"
                  className="min-w-0 flex-1"
                  type="text"
                  autoComplete="off"
                  value={newCat}
                  onChange={(e) => {
                    setNewCat(e.target.value);
                    setNewCatError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addCategory();
                    }
                  }}
                  aria-invalid={newCatError ? true : undefined}
                  aria-describedby={newCatError ? "ev-new-cat-error" : undefined}
                />
                <button type="button" onClick={addCategory} disabled={addingCat || !newCat.trim()} className="btn btn-outline">
                  {addingCat ? "Adding…" : "Add new category"}
                </button>
              </div>
              {newCatError && <p id="ev-new-cat-error" className="hint">{newCatError}</p>}
            </div>
          </div>

          <Field id="ev-description" label="Description" hint="Up to 1000 characters." error={errors.description}>
            <textarea
              id="ev-description"
              ref={reg("description")}
              rows={5}
              placeholder="Tell people what to expect"
              value={values.description}
              onChange={(e) => change("description", e.target.value)}
              onBlur={() => blur("description")}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={describedBy("ev-description", errors.description, true)}
              className="resize-y"
            />
          </Field>

          <div className="flex flex-col gap-2">
            <label htmlFor="ev-image" className="text-sm font-bold">
              Event image
            </label>
            {values.imageUrl && (
              <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-paper p-3">
                <EventImage src={values.imageUrl} alt="Preview of the event image" className="h-24 w-40 rounded-field object-cover" />
                <button type="button" onClick={removeImage} disabled={uploading} className="btn btn-outline">
                  Remove
                </button>
              </div>
            )}
            <input
              id="ev-image"
              ref={reg("imageUrl")}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={onImagePick}
              aria-invalid={imageError ? true : undefined}
              aria-describedby={imageError ? "ev-image-error" : undefined}
              className="block w-full text-sm file:mr-4 file:min-h-[44px] file:cursor-pointer file:rounded-btn file:border-2 file:border-ink file:bg-white file:px-5 file:font-bold file:text-ink disabled:opacity-50"
            />
            {uploading && (
              <p role="status" className="text-sm font-bold text-slate">
                Uploading…
              </p>
            )}
            {imageError && (
              <p id="ev-image-error" className="hint">
                {imageError}
              </p>
            )}
          </div>
        </Panel>

        <Panel title="When and where">
          <Field id="ev-location" label="Location" error={errors.location}>
            <input
              id="ev-location"
              ref={reg("location")}
              type="text"
              autoComplete="off"
              placeholder="Event location or Online"
              value={values.location}
              onChange={(e) => change("location", e.target.value)}
              onBlur={() => blur("location")}
              aria-invalid={errors.location ? true : undefined}
              aria-describedby={describedBy("ev-location", errors.location)}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field id="ev-start" label="Start date and time" error={errors.startDateTime}>
              <input
                id="ev-start"
                ref={reg("startDateTime")}
                type="datetime-local"
                value={values.startDateTime}
                onChange={(e) => change("startDateTime", e.target.value, ["endDateTime"])}
                onBlur={() => blur("startDateTime")}
                aria-invalid={errors.startDateTime ? true : undefined}
                aria-describedby={describedBy("ev-start", errors.startDateTime)}
              />
            </Field>
            <Field id="ev-end" label="End date and time" error={errors.endDateTime}>
              <input
                id="ev-end"
                ref={reg("endDateTime")}
                type="datetime-local"
                value={values.endDateTime}
                onChange={(e) => change("endDateTime", e.target.value, ["startDateTime"])}
                onBlur={() => blur("endDateTime")}
                aria-invalid={errors.endDateTime ? true : undefined}
                aria-describedby={describedBy("ev-end", errors.endDateTime)}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Tickets">
          <label className="flex min-h-[44px] w-fit cursor-pointer items-center gap-3 font-bold">
            <input
              type="checkbox"
              checked={values.isFree}
              onChange={(e) => toggleFree(e.target.checked)}
              className="h-[22px] w-[22px] accent-indigo"
            />
            Free event
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <Field id="ev-price" label="Price" error={errors.price}>
              <input
                id="ev-price"
                ref={reg("price")}
                type="number"
                inputMode="decimal"
                min={0}
                max={10000}
                step="0.01"
                placeholder="25"
                disabled={values.isFree}
                value={values.price}
                onChange={(e) => change("price", e.target.value)}
                onBlur={() => blur("price")}
                aria-invalid={errors.price ? true : undefined}
                aria-describedby={describedBy("ev-price", errors.price)}
              />
            </Field>
            <Field id="ev-url" label="Event URL (optional)" error={errors.url}>
              <input
                id="ev-url"
                ref={reg("url")}
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://"
                value={values.url}
                onChange={(e) => change("url", e.target.value)}
                onBlur={() => blur("url")}
                aria-invalid={errors.url ? true : undefined}
                aria-describedby={describedBy("ev-url", errors.url)}
              />
            </Field>
          </div>
        </Panel>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href={cancelHref} className="btn btn-outline btn-lg">
            Cancel
          </Link>
          <button type="submit" disabled={saving || uploading} className="btn btn-primary btn-lg">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </button>
        </div>
      </form>
    </Wrap>
  );
}

type LoadState = { status: "loading" } | { status: "ready"; event: EventDTO } | { status: "notfound" } | { status: "error"; message: string };

/** Create or edit an event. Edit mode loads the event, checks ownership, then renders the same form prefilled. */
export default function EventForm({ mode, eventId }: { mode: "create" | "edit"; eventId?: string }) {
  const { me, loading: meLoading } = useMe();
  const [load, setLoad] = useState<LoadState>(mode === "edit" && eventId ? { status: "loading" } : { status: "notfound" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (mode !== "edit") return;
    if (!eventId) {
      setLoad({ status: "notfound" });
      return;
    }
    let alive = true;
    setLoad({ status: "loading" });
    api
      .getEvent(eventId)
      .then((event) => {
        if (alive) setLoad(event ? { status: "ready", event } : { status: "notfound" });
      })
      .catch((err) => {
        if (alive) setLoad({ status: "error", message: errMsg(err, "Please check your connection and try again.") });
      });
    return () => {
      alive = false;
    };
  }, [mode, eventId, attempt]);

  if (mode === "create") {
    return <EventFormBody key="create" mode="create" initial={defaultValues()} />;
  }

  if (load.status === "loading" || meLoading) {
    return (
      <Wrap>
        <p role="status" className="sr-only">
          Loading event…
        </p>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Wrap>
    );
  }

  if (load.status === "error") {
    return (
      <Wrap>
        <ErrorState title="Couldn't load this event" message={load.message} onRetry={() => setAttempt((n) => n + 1)} />
      </Wrap>
    );
  }

  if (load.status === "notfound") {
    return (
      <Wrap>
        <EmptyState
          title="Event not found"
          body="It may have been removed, or the link is wrong."
          action={
            <Link href="/" className="btn btn-dark">
              Back to events
            </Link>
          }
        />
      </Wrap>
    );
  }

  if (load.status !== "ready") return null;

  if (!me || me._id !== load.event.organizer?._id) {
    return (
      <Wrap>
        <ErrorState title="You can only edit your own events" message="Sign in with the account that created this event to change it." />
      </Wrap>
    );
  }

  return (
    <EventFormBody
      key={load.event._id}
      mode="edit"
      eventId={eventId}
      initial={valuesFromEvent(load.event)}
      initialCategory={load.event.category}
    />
  );
}
