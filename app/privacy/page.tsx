export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-semibold text-ink">Politica de Privacidad</h1>
      <div className="mt-6 space-y-5 rounded-md border border-stone-200 bg-white p-6 text-sm leading-6 text-stone-700 shadow-sm">
        <p>
          UH Physics Map guarda informacion de perfil a nivel de ciudad enviada con consentimiento por miembros de la red universitaria de fisica. No se recopilan ni se muestran direcciones exactas.
        </p>
        <p>
          Los popups del mapa pueden mostrar nombre, ciudad y pais actuales, institucion, cargo, campo de investigacion, sitio web, ORCID, LinkedIn y email solo cuando la persona activa explicitamente la visualizacion publica del email.
        </p>
        <p>
          Los perfiles nuevos o editados requieren aprobacion administrativa antes de aparecer publicamente. Cada persona recibe un codigo privado de edicion una sola vez; solo se guarda un hash de ese codigo.
        </p>
        <p>
          Las personas pueden usar su codigo de edicion para actualizar u ocultar su perfil. Los administradores pueden aprobar, rechazar, ocultar, eliminar y exportar perfiles publicos aprobados para fines de la red universitaria.
        </p>
      </div>
    </main>
  );
}
