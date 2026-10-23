import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultasService } from '../../services/consultas.service';
import { Consulta } from '../../models';

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notas.html',
  styleUrl: './notas.css'
})
export class Notas implements OnInit {
  private consultasService = inject(ConsultasService);

  pendientes = signal<Consulta[]>([]);
  isLoading = signal<boolean>(false);
  terminoBusqueda = signal<string>('');

  // Modal para confirmar resolución
  consultaAResolver = signal<Consulta | null>(null);
  isResolving = signal<boolean>(false);
  errorMessageModal = signal<string | null>(null);

  ngOnInit() {
    this.cargarNotas();
  }

  cargarNotas() {
    this.isLoading.set(true);
    this.consultasService.obtenerNotasPendientes(this.terminoBusqueda()).subscribe({
      next: (data) => {
        this.pendientes.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onBuscar(event: Event) {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
    this.cargarNotas();
  }

  guardarNotaInline(consulta: Consulta, event: FocusEvent) {
    const nuevoTexto = (event.target as HTMLElement).innerText.trim();
    if (nuevoTexto !== (consulta.notas || '')) {
      this.consultasService.actualizarResolucion(consulta.id, { notas: nuevoTexto }).subscribe({
        next: () => {
          consulta.notas = nuevoTexto;
        }
      });
    }
  }

  // Abre el modal sin confirm nativo
  solicitarResolucion(consulta: Consulta) {
    this.errorMessageModal.set(null);
    this.consultaAResolver.set(consulta);
  }

  cerrarModalResolucion() {
    if (this.isResolving()) return;
    this.consultaAResolver.set(null);
    this.errorMessageModal.set(null);
  }

  confirmarResolucion() {
    const consulta = this.consultaAResolver();
    if (!consulta) return;

    this.isResolving.set(true);
    this.errorMessageModal.set(null);

    this.consultasService.actualizarResolucion(consulta.id, { estado: 'contactado' }).subscribe({
      next: () => {
        this.isResolving.set(false);
        this.pendientes.update((list) => list.filter(item => item.id !== consulta.id));
        this.cerrarModalResolucion();
      },
      error: (err) => {
        this.isResolving.set(false);
        this.errorMessageModal.set(err.error?.error || 'Error al resolver la consulta');
      }
    });
  }

  abrirWhatsApp(telefono: string | null | undefined) {
    if (!telefono) return;
    const cleanNumber = telefono.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  }
}