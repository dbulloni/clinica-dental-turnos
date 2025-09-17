import React from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  FileText, 
  MapPin, 
  Calendar,
  Edit,
  X
} from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Card from '../UI/Card';
import PatientHistory from './PatientHistory';
import { Patient } from '../../types';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onEdit?: (patient: Patient) => void;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onEdit,
}) => {
  if (!patient) return null;

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

  const age = calculateAge(patient.dateOfBirth);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Paciente"
      size="xl"
    >
      <div className="space-y-6">
        {/* Patient Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold text-primary-600">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </span>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <Badge 
                  variant={patient.isActive ? 'success' : 'secondary'}
                  dot
                >
                  {patient.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                <span className="text-sm text-gray-500">
                  Registrado el {new Date(patient.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => onEdit?.(patient)}
            icon={<Edit className="w-4 h-4" />}
          >
            Editar
          </Button>
        </div>

        {/* Patient Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Información Personal
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Documento</p>
                    <p className="text-sm text-gray-600">{patient.document}</p>
                  </div>
                </div>

                {patient.dateOfBirth && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fecha de Nacimiento</p>
                      <p className="text-sm text-gray-600">
                        {new Date(patient.dateOfBirth).toLocaleDateString('es-ES')}
                        {age && <span className="ml-2 text-gray-500">({age} años)</span>}
                      </p>
                    </div>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dirección</p>
                      <p className="text-sm text-gray-600">{patient.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Contact Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Información de Contacto
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Teléfono</p>
                    <p className="text-sm text-gray-600">{patient.phone}</p>
                  </div>
                </div>

                {patient.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Notes */}
        {patient.notes && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Notas y Observaciones
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {patient.notes}
                </p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Patient History */}
        <PatientHistory patient={patient} />

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PatientDetailsModal;