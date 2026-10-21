import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarrerasService, Carrera } from '../../services/carreras.service';

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

  pestanaActiva = signal<'activas' | 'inactivas'>('activas');
  mostrarModal = signal<boolean>(false);
  mostrarModalEdicion = signal<boolean>(false);
  carreraSeleccionada = signal<Carrera | null>(null);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: [''],
    duracion_anios: [null as number | null, [Validators.min(1), Validators.max(10)]]
  });

  ngOnInit() {
    this.cargarCarreras();
  }

  cargarCarreras() {
    const esActiva = this.pestanaActiva() === 'activas';
    this.carrerasService.obtenerCarreras(esActiva).subscribe();
  }

  cambiarPestana(pestana: 'activas' | 'inactivas') {
    this.pestanaActiva.set(pestana);
    this.cargarCarreras();
  }

  darDeBaja(carrera: Carrera) {
    if (confirm(`¿Seguro que deseás desactivar "${carrera.nombre}"? Pasará a la pestaña de Inactivas.`)) {
      this.carrerasService.cambiarEstado(carrera.id, false).subscribe();
    }
  }

  darDeAlta(carrera: Carrera) {
    if (confirm(`¿Deseás reactivar "${carrera.nombre}"? Volverá a la oferta académica activa.`)) {
      this.carrerasService.cambiarEstado(carrera.id, true).subscribe();
    }
  }

  abrirModal() {
    this.form.reset();
    this.errorMessage.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  guardarCarrera() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const duracionValue = (raw.duracion_anios != null && !isNaN(Number(raw.duracion_anios)))
      ? Number(raw.duracion_anios)
      : null;

    const payload = {
      nombre: raw.nombre!.trim(),
      codigo: raw.codigo ? raw.codigo.trim() : null,
      duracion_anios: duracionValue
    };

    this.carrerasService.crearCarrera(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.cerrarModal();
        if (this.pestanaActiva() !== 'activas') {
          this.cambiarPestana('activas');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error || 'Error al guardar la carrera');
      }
    });
  }

  // --- MÉTODOS PARA EDICIÓN ---

  abrirModalEdicion(carrera: Carrera) {
    this.carreraSeleccionada.set(carrera);
    this.errorMessage.set(null);

    this.form.reset({
      nombre: carrera.nombre,
      codigo: carrera.codigo || '',
      duracion_anios: carrera.duracion_anios ?? null
    });

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

    const carrera = this.carreraSeleccionada();
    if (!carrera) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const duracionValue = (raw.duracion_anios != null && !isNaN(Number(raw.duracion_anios)))
      ? Number(raw.duracion_anios)
      : null;

    const payload = {
      nombre: raw.nombre!.trim(),
      codigo: raw.codigo ? raw.codigo.trim() : null,
      duracion_anios: duracionValue
    };

    this.carrerasService.actualizarCarrera(carrera.id, payload).subscribe({
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
}