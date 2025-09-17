import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react';
import Table from '../UI/Table';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import { Patient, TableColumn } from '../../types';
import { useTogglePatientStatus, useDeletePatient } from '../../hooks/usePatients';

interface PatientListProps {
  patients: Patient[];
  loading?: boolean;
  onEditPatient?: (patient: Patient) => void;
  onViewPatient?: (patient: Patient) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

const PatientList: React.FC<PatientListProps> = ({
  patients,
  loading = false,
  onEditPatient,
  onViewPatient,
  sortKey,
  sortDirection,
  onSort,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  
  const toggleStatusMutation = useTogglePatientStatus();
  const deletePatientMutation = useDeletePatient();

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (patientToDelete) {
      await deletePatientMutation.mutateAsync(patientToDelete.id);
      setDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleToggleStatus = async (patient: Patient) => {
    await toggleStatusMutation.mutateAsync({
      id: patient.id,
      isActive: !patient.isActive,
    });
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const columns: TableColumn<Patient>[] = [
    {
      key: 'firstName',
      title: 'Paciente',
      sortable: true,
      render: (_, patient) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {patient.firstName} {patient.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {patient.document}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Contacto',
      render: (_, patient) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-sm text-gray-900">
            <Phone className="w-3 h-3" />
            <span>{patient.phone}</span>
          </div>
          {patient.email && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{patient.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dateOfBirth',
      title: 'Edad',
      sortable: true,
      render: (_, patient) => {
        const age = calculateAge(patient.dateOfBirth);
        return (
          <div className="text-sm text-gray-900">
            {age ? (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>{age} años</span>
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      title: 'Estado',
      render: (_, patient) => (
        <Badge 
          variant={patient.isActive ? 'success' : 'secondary'}
          dot
        >
          {patient.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: 'Registrado',
      sortable: true,
      render: (_, patient) => (
        <div className="text-sm text-gray-500">
          {new Date(patient.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Acciones',
      width: '120px',
      render: (_, patient) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewPatient?.(patient)}
            className="p-1"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditPatient?.(patient)}
            className="p-1"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(patient)}
            className="p-1"
            title={patient.isActive ? 'Desactivar' : 'Activar'}
            loading={toggleStatusMutation.isLoading}
          >
            {patient.isActive ? (
              <UserX className="w-4 h-4 text-orange-600" />
            ) : (
              <UserCheck className="w-4 h-4 text-green-600" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(patient)}
            className="p-1 text-red-600 hover:text-red-700"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        data={patients}
        loading={loading}
        emptyMessage="No se encontraron pacientes"
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={onSort}
        rowClassName={(patient) => 
          !patient.isActive ? 'opacity-60' : ''
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Eliminar Paciente
              </h3>
              <p className="text-sm text-gray-600">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {patientToDelete && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-900">
                <strong>Paciente:</strong> {patientToDelete.firstName} {patientToDelete.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Documento:</strong> {patientToDelete.document}
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Se mantendrá el historial de turnos asociados 
              a este paciente, pero no podrá crear nuevos turnos.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deletePatientMutation.isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={deletePatientMutation.isLoading}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar Paciente
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PatientList;