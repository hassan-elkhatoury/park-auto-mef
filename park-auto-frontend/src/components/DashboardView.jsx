import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDashboardData } from './dashboard/useDashboardData';
import {
  applyScope, SCOPED_ROLES, resolveRole, userDirection, filterDriverData,
} from './dashboard/dashboardUtils';
import { DashboardHeader } from './dashboard/widgets';
import {
  AdminDashboard,
  CentralManagerDashboard,
  LocalManagerDashboard,
  FinancialDashboard,
  ServiceHeadDashboard,
  DriverDashboard,
  ConsultationDashboard,
} from './dashboard/roleDashboards';

const SCOPE_LABELS = {
  ADMIN: 'National — toutes directions',
  GESTIONNAIRE_CENTRAL: 'National — parc ministériel',
  GESTIONNAIRE_LOCAL: null,
  RESPONSABLE_FINANCIER: 'National — exécution budgétaire & TCO',
  RESPONSABLE_SERVICE: null,
  CONDUCTEUR: 'Personnel — vos missions uniquement',
  CONSULTATION: 'National — lecture seule',
};

export default function DashboardView({ user }) {
  const navigate = useNavigate();
  const roleName = resolveRole(user);
  const direction = userDirection(user);
  const { data, loading, failed, lastUpdated, refresh } = useDashboardData(roleName, { direction });

  const scoped = useMemo(() => {
    const base = {
      vehicules: [], demandes: [], affectations: [], pleins: [], cartes: [],
      anomalies: [], interventions: [], alertes: [], assurances: [], sinistres: [],
      pannes: [], taxes: [], conducteurs: [], utilisateurs: [], auditLogs: [],
      summary: null, tcoDirections: [], tcoMotorisations: [],
      budgetSynthese: null, budgetAlertes: [], engagements: [],
      ...data,
    };
    if (roleName === 'CONDUCTEUR') return filterDriverData(base, user);
    if (SCOPED_ROLES.includes(roleName) && direction) return applyScope(base, direction);
    return base;
  }, [data, roleName, direction, user]);

  const scopeLabel = SCOPE_LABELS[roleName] || direction || 'Périmètre ministériel';
  const resolvedScope = scopeLabel || direction || 'Votre direction';
  const readOnly = roleName === 'CONSULTATION';

  const RoleView = {
    ADMIN: AdminDashboard,
    GESTIONNAIRE_CENTRAL: CentralManagerDashboard,
    GESTIONNAIRE_LOCAL: LocalManagerDashboard,
    RESPONSABLE_FINANCIER: FinancialDashboard,
    RESPONSABLE_SERVICE: ServiceHeadDashboard,
    CONDUCTEUR: DriverDashboard,
    CONSULTATION: ConsultationDashboard,
  }[roleName] || ConsultationDashboard;

  if (loading && !lastUpdated) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Préparation du tableau de bord…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto space-y-6">
      <DashboardHeader
        user={user}
        roleName={roleName}
        scopeLabel={resolvedScope}
        readOnly={readOnly}
        loading={loading}
        onRefresh={refresh}
        lastUpdated={lastUpdated}
        failed={failed}
      />
      {SCOPED_ROLES.includes(roleName) && !direction && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <span className="font-extrabold">Direction non renseignée sur le profil.</span>
          {' '}Les indicateurs affichés couvrent tout le parc. Demandez à un administrateur d’attacher votre compte à une direction MEF pour n’afficher que votre périmètre.
        </div>
      )}
      <RoleView
        data={scoped}
        user={user}
        navigate={navigate}
        scopeLabel={direction || resolvedScope}
      />
    </div>
  );
}
