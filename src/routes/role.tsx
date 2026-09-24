import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ShieldAlert, Database, FileText, Upload, Users, Settings, Lock, Eye, Download, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
export const Route = createFileRoute('/role')({
head: () => ({
meta: [
{ title: "Gestion du stockage · HUMASAFE" },
{ name: "description", content: "Espace de stockage et de centralisation des données terrain pour la coordination humanitaire." },
],
}),
component: RouteComponent,
});
type UserRole = 'admin' | 'analyst' | 'informateur' | 'actor';
interface StorageItem {
id: string;
title: string;
type: string;
author: string;
date: string;
confidentiality: 'Interne' | 'Restreint' | 'Public';
status: 'Validé' | 'En attente' | 'Archivé';
}
function RouteComponent() {
// Rôle par défaut (peut être connecté à votre contexte d'authentification réel)
const [currentUserRole, setCurrentUserRole] = useState('analyst');
const [uploadTitle, setUploadTitle] = useState('');
const [uploadType, setUploadType] = useState('PDF');
// Données de stockage simulées
const [storageFiles, setStorageFiles] = useState<StorageItem[]>([
{ id: '1', title: 'Rapport_Securite_Goma_Nord.pdf', type: 'PDF', author: 'Amina K. (Informateur)', date: '2026-09-16', confidentiality: 'Restreint', status: 'Validé' },
{ id: '2', title: 'Cartographie_Aires_Sante_Q3.geojson', type: 'SIG', author: 'Jean M. (Analyste)', date: '2026-09-15', confidentiality: 'Interne', status: 'Validé' },
{ id: '3', title: 'Signalement_Incidents_Rutshuru.xlsx', type: 'Excel', author: 'Serge B. (Informateur)', date: '2026-09-14', confidentiality: 'Restreint', status: 'En attente' },
{ id: '4', title: 'Note_Orientation_Axes_Routiers.pdf', type: 'PDF', author: 'Coordination HUMASAFE', date: '2026-09-12', confidentiality: 'Public', status: 'Validé' },
]);
const handleUploadSubmit = (e: React.FormEvent) => {
e.preventDefault();
if (!uploadTitle.trim()) return;
const newFile: StorageItem = {
  id: Date.now().toString(),
  title: uploadTitle,
  type: uploadType,
  author: currentUserRole === 'informant' ? 'Vous (Informateur)' : 'Vous (' + currentUserRole + ')',
  date: new Date().toISOString().split('T')[0],
  confidentiality: 'Restreint',
  status: currentUserRole === 'ADMIN' || currentUserRole === 'administrateur' ? 'Validé' : 'En attente',
};

setStorageFiles([newFile, ...storageFiles]);
setUploadTitle('');
toast.success("Document téléversé avec succès !");


};
const handleDeleteFile = (id: string) => {
setStorageFiles(storageFiles.filter(f => f.id !== id));
toast.info("Document supprimé du référentiel.");
};
const handleValidateFile = (id: string) => {
setStorageFiles(storageFiles.map(f => f.id === id ? { ...f, status: 'Validé' as const } : f));
toast.success("Document validé et publié pour les acteurs.");
};
return (
  <div className="mx-auto max-w-6xl space-y-8 p-6">
    {/* En-tête principal et Sélecteur de rôle */}
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Stockage & Sécurité des Données · Nord-Kivu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Référentiel Documentaire HUMASAFE</p>
      </div>

    {/* Panneau de simulation des rôles */}
    <div className="flex items-center gap-3 bg-card border border-border p-3 rounded-lg shadow-sm">
      <span className="text-xs font-mono uppercase text-muted-foreground">Profil actif :</span>
      <select 
        value={currentUserRole} 
        onChange={(e) => {
          setCurrentUserRole(e.target.value as UserRole);
          toast(`Basculement en mode : ${e.target.value.toUpperCase()}`);
        }}
        className="bg-input border border-border rounded px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
      >
        <option value="informant">Informateur (Saisie)</option>
        <option value="analyst">Analyste (Traitement)</option>
        <option value="actor">Acteur (Consultation)</option>
        <option value="admin">Administrateur (Gestion)</option>
      </select>
    </div>
  </div>

  {/* Rôles et Vues adaptatives */}
  <div className="space-y-8">

    {/* 1. VUE INFORMATEUR */}
    {currentUserRole === 'informant' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Téléverser un rapport terrain</h2>
              <p className="text-xs text-muted-foreground">Vos rapports seront soumis aux analystes avant diffusion.</p>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-[10px] uppercase font-mono text-muted-foreground mb-1">Nom du fichier / Rapport</label>
              <input 
                type="text" 
                placeholder="Ex: Situation_Rutshuru_1609.pdf" 
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                required
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-muted-foreground mb-1">Type de document</label>
              <select 
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="PDF">Rapport PDF</option>
                <option value="Excel">Tableau de données (Excel)</option>
                <option value="SIG">Fichier Géographique (SIG / GeoJSON)</option>
                <option value="Media">Média / Photo terrain</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded text-xs font-medium cursor-pointer transition hover:opacity-90">
              Soumettre au réseau
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-border bg-card/40 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Guide Informateur</div>
            <h3 className="font-semibold text-lg">Sécurité et Anonymat</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              En tant qu'informateur, vos métadonnées sont chiffrées de bout en bout. Veillez à ne pas inclure d'informations nominatives non vérifiées dans vos notes de terrain.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-mono mt-4">
            <CheckCircle className="h-4 w-4" /> Chiffrement actif · Connexion sécurisée Goma
          </div>
        </div>
      </div>
    )}

    {/* 2. VUE ANALYSTE */}
    {currentUserRole === 'analyst' && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
          <div className="text-xs uppercase font-mono text-muted-foreground">Rapports en attente de validation</div>
          <div className="text-2xl font-semibold mt-1 text-amber-500">
            {storageFiles.filter(f => f.status === 'En attente').length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Nécessite une vérification croisée</div>
        </div>
        <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
          <div className="text-xs uppercase font-mono text-muted-foreground">Cartographies SIG</div>
          <div className="text-2xl font-semibold mt-1">12</div>
          <div className="text-[11px] text-muted-foreground mt-1">Mises à jour aujourd'hui</div>
        </div>
        <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
          <div className="text-xs uppercase font-mono text-muted-foreground">Niveau d'alerte global</div>
          <div className="text-2xl font-semibold text-orange-500 mt-1 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Élevé
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Axes Nord-Kivu sous surveillance</div>
        </div>
      </div>
    )}

    {/* 3. VUE ACTEUR */}
    {currentUserRole === 'actor' && (
      <div className="rounded-lg border border-border bg-card/40 p-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="font-mono text-xs uppercase tracking-widest text-primary">Mode Opérationnel Acteur</div>
          <h2 className="text-lg font-semibold">Consignes et notes d'orientation validées</h2>
          <p className="text-xs text-muted-foreground">Vous accédez aux documents prêts pour l'exécution d'interventions humanitaires.</p>
        </div>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-medium rounded cursor-pointer">
          Télécharger le kit de sécurité Q3
        </button>
      </div>
    )}

    {/* 4. VUE ADMINISTRATEUR */}
    {currentUserRole === 'admin' && (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-red-500/10 text-red-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-400">Administration Système & Quotas</h2>
            <p className="text-xs text-muted-foreground">Supervision générale du serveur de stockage et contrôle d'intégrité des rôles.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <button className="px-3 py-1.5 bg-red-600 text-white text-xs rounded font-medium flex items-center gap-1.5 cursor-pointer hover:bg-red-700 transition">
            <Settings className="h-3.5 w-3.5" /> Paramètres de rétention
          </button>
          <button className="px-3 py-1.5 border border-border bg-card text-xs rounded font-medium flex items-center gap-1.5 cursor-pointer hover:bg-accent">
            <Users className="h-3.5 w-3.5" /> Gérer les habilitations
          </button>
        </div>
      </div>
    )}

    {/* Tableau central des fichiers (Adapté selon le rôle) */}
    <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" /> Référentiel des documents et rapports ({storageFiles.length})
        </div>
        <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">
          Mode : {currentUserRole}
        </span>
      </div>

      <div className="divide-y divide-border">
        {storageFiles.map((file) => (
          <div key={file.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-muted/30 transition">
            <div className="flex items-start md:items-center gap-3">
              <div className="p-2 bg-muted rounded">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">{file.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>Auteur : {file.author}</span>
                  <span>•</span>
                  <span>Date : {file.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              {/* Badge de statut */}
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                file.status === 'Validé' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {file.status}
              </span>

              {/* Badge de confidentialité */}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-accent text-accent-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> {file.confidentiality}
              </span>

              {/* Actions spécifiques par rôle */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer" title="Télécharger">
                  <Download className="h-4 w-4" />
                </button>

                {/* Actions Analyste / Admin : Validation */}
                {(currentUserRole === 'admin' || currentUserRole === 'analyst') && file.status === 'En attente' && (
                  <button 
                    onClick={() => handleValidateFile(file.id)}
                    className="px-2 py-1 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 text-xs rounded font-medium cursor-pointer"
                  >
                    Valider
                  </button>
                )}

                {/* Actions Admin / Analyste : Suppression */}
                {(currentUserRole === 'admin' || currentUserRole === 'analyst') && (
                  <button 
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded text-red-400 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

  </div>
</div>


);
}
