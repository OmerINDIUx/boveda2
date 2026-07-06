'use client';

import { useEffect, useMemo, useState } from 'react';
import { RequirePermission } from '../../../components/auth/require-permission';
import { PermissionKey } from '../../../lib/permissions';
import { apiGet, apiPost } from '../../../lib/api';

type ProjectOption = { id: string; name: string; code: string };
type UserOption = { id: string; name: string; email: string };
type ProjectMember = {
  id: string;
  role: string;
  canManageDocuments: boolean;
  canManageContracts: boolean;
  user?: UserOption | null;
};

type FormOptionsResponse = {
  users: UserOption[];
};

type AssignmentForm = {
  projectId: string;
  userId: string;
  role: 'viewer' | 'contributor' | 'manager' | 'owner';
  canManageDocuments: boolean;
  canManageContracts: boolean;
};

const emptyForm: AssignmentForm = {
  projectId: '',
  userId: '',
  role: 'viewer',
  canManageDocuments: false,
  canManageContracts: false
};

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('holocron_token');
}

function ProjectUsersWorkspace() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBase() {
      try {
        const [projectsResponse, formOptionsResponse] = await Promise.all([
          apiGet<ProjectOption[]>('/projects', getToken() ?? undefined),
          apiGet<FormOptionsResponse>('/projects/form-options', getToken() ?? undefined)
        ]);

        if (!active) return;
        setProjects(projectsResponse);
        setUsers(formOptionsResponse.users);
        setForm((current) => ({
          ...current,
          projectId: current.projectId || projectsResponse[0]?.id || '',
          userId: current.userId || formOptionsResponse.users[0]?.id || ''
        }));
      } catch {
        if (!active) return;
        setError('No fue posible cargar proyectos y usuarios para la asignación.');
      }
    }

    void loadBase();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.projectId) return;
    let active = true;

    async function loadMembers() {
      try {
        const response = await apiGet<ProjectMember[]>(`/projects/${form.projectId}/users`, getToken() ?? undefined);
        if (!active) return;
        setMembers(response);
      } catch {
        if (!active) return;
        setMembers([]);
      }
    }

    void loadMembers();
    return () => {
      active = false;
    };
  }, [form.projectId]);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(needle));
  }, [users, search]);

  async function assignUser() {
    if (!form.projectId || !form.userId) {
      setError('Selecciona proyecto y usuario.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiPost(
        `/projects/${form.projectId}/users`,
        {
          userId: form.userId,
          role: form.role,
          canManageDocuments: form.canManageDocuments,
          canManageContracts: form.canManageContracts
        },
        getToken() ?? undefined
      );

      const nextMembers = await apiGet<ProjectMember[]>(`/projects/${form.projectId}/users`, getToken() ?? undefined);
      setMembers(nextMembers);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'No fue posible asignar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Usuarios por proyecto</h1>
          <p className="muted">Asignación separada del alta del proyecto para evitar errores durante la creación.</p>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <section className="grid">
        <article className="card span-4">
          <div className="field">
            <label>Proyecto</label>
            <select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}>
              <option value="">Selecciona un proyecto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Buscar usuario</label>
            <input placeholder="Nombre o correo" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="field">
            <label>Usuario</label>
            <select value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}>
              <option value="">Selecciona un usuario</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.email}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Rol en proyecto</label>
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AssignmentForm['role'] }))}>
              <option value="viewer">viewer</option>
              <option value="contributor">contributor</option>
              <option value="manager">manager</option>
              <option value="owner">owner</option>
            </select>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={form.canManageDocuments}
              onChange={(event) => setForm((current) => ({ ...current, canManageDocuments: event.target.checked }))}
            />
            Puede gestionar documentos
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={form.canManageContracts}
              onChange={(event) => setForm((current) => ({ ...current, canManageContracts: event.target.checked }))}
            />
            Puede gestionar contratos
          </label>
          <button className="button" type="button" onClick={assignUser} disabled={saving}>
            {saving ? 'Asignando...' : 'Asignar'}
          </button>
        </article>

        <article className="card span-8">
          <div className="panel-header">
            <h2>Usuarios asignados</h2>
            <span className="pill">{members.length}</span>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Documentos</th>
                  <th>Contratos</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.user?.name ?? 'Sin nombre'}</td>
                    <td>{member.user?.email ?? 'Sin correo'}</td>
                    <td>{member.role}</td>
                    <td>{member.canManageDocuments ? 'Sí' : 'No'}</td>
                    <td>{member.canManageContracts ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </section>
  );
}

export default function ProjectUsersPage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectUsersWorkspace />
    </RequirePermission>
  );
}
