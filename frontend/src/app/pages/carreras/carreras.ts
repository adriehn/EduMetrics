import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarrerasService } from '../../services/carreras.service';
import { Carrera, CarreraDTO, ConfirmacionCarrera } from '../../models';

@Component({
  selector: 'app-carreras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './carreras.html',
  styleUrl: './carreras.css'
})
export class Carreras implements OnInit {
  carrerasService = inject(CarrerasService);
  private fb = inject(FormBuilder);

  // Control de pestañas
  pestanaActiva = signal<'activas' | 'inactivas'>('activas');

  // Modales de alta y edición
  mostrarModal = signal<boolean>(false);
  mostrarModalEdicion = signal<boolean>(false);
  carreraSeleccionada = signal<Carrera | null>(null);

  // Modal de confirmación (Alta / Baja)
  carreraAccion = signal<ConfirmacionCarrera | null>(null);

  // Estados de carga y error
  isSubmitting = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: [''],
    duracion_anios: [null as number | null, [Validators.min(1), Validators.max(10)]]
  });

  ngOnInit() {
    this.cargarCarreras();
  }

  cambiarPestana(pestana: 'activas' | 'inactivas') {
    this.pestanaActiva.set(pestana);
    this.cargarCarreras();
  }

  cargarCarreras() {
    const soloActivas = this.pestanaActiva() === 'activas';
    this.carrerasService.obtenerCarreras(soloActivas).subscribe();
  }

  // --- Modal Alta ---
  abrirModal() {
    this.form.reset({
      nombre: '',
      codigo: '',
      duracion_anios: null
    });
    this.errorMessage.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.errorMessage.set(null);
  }

  guardarCarrera() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const payload: CarreraDTO = {
      nombre: raw.nombre!.trim(),
      codigo: raw.codigo ? raw.codigo.trim() : null,
      duracion_anios: raw.duracion_anios ? Number(raw.duracion_anios) : null
    };

    this.carrerasService.crearCarrera(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.cerrarModal();
        this.cargarCarreras();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error || 'Error al crear la carrera');
      }
    });
  }

  // --- Modal Edición ---
  abrirModalEdicion(carrera: Carrera) {
    this.carreraSeleccionada.set(carrera);
    this.form.reset({
      nombre: carrera.nombre,
      codigo: carrera.codigo || '',
      duracion_anios: carrera.duracion_anios || null
    });
    this.errorMessage.set(null);
    this.mostrarModalEdicion.set(true);
  }

  cerrarModalEdicion() {
    this.mostrarModalEdicion.set(false);
    this.carreraSeleccionada.set(null);
    this.errorMessage.set(null);
  }

  guardarEdicion() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const seleccionada = this.carreraSeleccionada();
    if (!seleccionada) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const payload = {
      nombre: raw.nombre!.trim(),
      codigo: raw.codigo ? raw.codigo.trim() : null,
      duracion_anios: raw.duracion_anios ? Number(raw.duracion_anios) : null
    };

    this.carrerasService.actualizarCarrera(seleccionada.id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.cerrarModalEdicion();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error || 'Error al actualizar la carrera');
      }
    });
  }

  // --- Modal Confirmación (Alta / Baja) ---
  solicitarCambioEstado(carrera: Carrera, tipo: 'alta' | 'baja') {
    this.errorMessage.set(null);
    this.carreraAccion.set({ carrera, tipo });
  }

  cerrarModalConfirmacion() {
    if (this.isProcessing()) return;
    this.carreraAccion.set(null);
    this.errorMessage.set(null);
  }

  confirmarCambioEstado() {
    const accion = this.carreraAccion();
    if (!accion) return;

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    const nuevoEstado = accion.tipo === 'alta';

    this.carrerasService.cambiarEstado(accion.carrera.id, nuevoEstado).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.cerrarModalConfirmacion();
        this.cargarCarreras();
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(err.error?.error || `Error al dar de ${accion.tipo} la carrera`);
      }
    });
  }
}