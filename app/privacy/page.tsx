export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-semibold text-ink">Privacy Policy</h1>
      <div className="mt-6 space-y-5 rounded-md border border-stone-200 bg-white p-6 text-sm leading-6 text-stone-700 shadow-sm">
        <p>
          Physics World Map stores city-level profile information submitted with consent by members of the university physics network. Exact street addresses are not collected or displayed.
        </p>
        <p>
          Public map popups may show name, current city and country, institution, position, research field, website, ORCID, LinkedIn, and email only when the submitter explicitly enables public email display.
        </p>
        <p>
          New and edited profiles require administrator approval before they appear publicly. Submitters receive a private edit code once; only a hash of that code is stored.
        </p>
        <p>
          Submitters can use their edit code to update or hide their profile. Administrators can approve, reject, hide, delete, and export approved public profiles for university network purposes.
        </p>
      </div>
    </main>
  );
}
