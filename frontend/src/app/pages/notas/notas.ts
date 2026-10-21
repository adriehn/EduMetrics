import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultasService, Consulta } from '../../services/consultas.service';

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

  marcarResuelta(consulta: Consulta) {
    if (confirm(`¿Marcar consulta ${consulta.codigo_ticket || ''} de ${consulta.nombre_interesado} como contactada/resuelta?`)) {
      this.consultasService.actualizarResolucion(consulta.id, { estado: 'contactado' }).subscribe({
        next: () => {
          // La quitamos de la planilla de pendientes
          this.pendientes.update((list) => list.filter(item => item.id !== consulta.id));
        }
      });
    }
  }

  abrirWhatsApp(telefono: string | null | undefined) {
    if (!telefono) return;
    const cleanNumber = telefono.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  }
}