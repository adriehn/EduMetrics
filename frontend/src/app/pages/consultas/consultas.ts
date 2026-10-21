import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ConsultasService, CrearConsultaPayload, Consulta } from '../../services/consultas.service';
import { CarrerasService } from '../../services/carreras.service';

type SortColumn = 'nombre_interesado' | 'carrera' | 'canal' | 'creado_en';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './consultas.html',
  styleUrl: './consultas.css'
})
export class Consultas implements OnInit {
  consultasService = inject(ConsultasService);
  carrerasService = inject(CarrerasService);
  private fb = inject(FormBuilder);

  mostrarModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Señales para filtros y orden
  searchTerm = signal<string>('');
  fechaDesde = signal<string>(''); // formato YYYY-MM-DD
  fechaHasta = signal<string>(''); // formato YYYY-MM-DD
  sortColumn = signal<SortColumn>('creado_en');
  sortDirection = signal<SortDirection>('desc');

  // Signal computado: aplica filtros y ordenamiento en tiempo real
  consultasFiltradas = computed(() => {
    let list = [...this.consultasService.consultas()];
    const search = this.searchTerm().toLowerCase().trim();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    const col = this.sortColumn();
    const dir = this.sortDirection();

    // 1. Filtro por texto (Nombre, Teléfono, Email o Carrera)
    if (search) {
      list = list.filter((c) => {
        const nombre = c.nombre_interesado?.toLowerCase() || '';
        const tel = c.telefono?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || '';
        const carrera = (c.carreras?.nombre || this.obtenerNombreCarrera(c.carrera_id)).toLowerCase();
        const canal = c.canal?.toLowerCase() || '';

        return (
          nombre.includes(search) ||
          tel.includes(search) ||
          email.includes(search) ||
          carrera.includes(search) ||
          canal.includes(search)
        );
      });
    }
    // 2. Filtro por fecha (compara día YYYY-MM-DD)
    if (desde || hasta) {
      list = list.filter((c) => {
        const fechaConsulta = c.creado_en ? c.creado_en.substring(0, 10) : '';
        if (!fechaConsulta) return false;

        if (desde && hasta) {
          return fechaConsulta >= desde && fechaConsulta <= hasta;
        }
        if (desde) {
          return fechaConsulta >= desde;
        }
        if (hasta) {
          return fechaConsulta <= hasta;
        }
        return true;
      });
    }

    // 3. Ordenamiento
    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (col) {
        case 'nombre_interesado':
          valA = a.nombre_interesado || '';
          valB = b.nombre_interesado || '';
          break;
        case 'carrera':
          valA = a.carreras?.nombre || this.obtenerNombreCarrera(a.carrera_id);
          valB = b.carreras?.nombre || this.obtenerNombreCarrera(b.carrera_id);
          break;
        case 'canal':
          valA = a.canal || '';
          valB = b.canal || '';
          break;
        case 'creado_en':
          valA = a.creado_en || '';
          valB = b.creado_en || '';
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
      return dir === 'asc' ? comparison : -comparison;
    });

    return list;
  });

  form = this.fb.group({
    nombre_interesado: ['', [Validators.required, Validators.minLength(3)]],
    carrera_id: ['', [Validators.required]],
    canal: ['whatsapp', [Validators.required]],
    telefono: [''],
    email: ['', [Validators.email]],
    notas: ['']
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.consultasService.obtenerConsultas().subscribe();
    if (this.carrerasService.carreras().length === 0) {
      this.carrerasService.obtenerCarreras().subscribe();
    }
  }

  // Alterna o asigna el orden por columna
  toggleSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  limpiarFiltros() {
    this.searchTerm.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }
  abrirModal() {
    this.form.reset({
      nombre_interesado: '',
      canal: 'whatsapp',
      carrera_id: this.carrerasService.carreras()[0]?.id || '',
      telefono: '',
      email: '',
      notas: ''
    });
    this.errorMessage.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  guardarConsulta() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const payload: CrearConsultaPayload = {
      nombre_interesado: raw.nombre_interesado!.trim(),
      carrera_id: raw.carrera_id!,
      canal: raw.canal!,
      telefono: raw.telefono ? raw.telefono.trim() : null,
      email: raw.email ? raw.email.trim() : null,
      notas: raw.notas ? raw.notas.trim() : null
    };

    this.consultasService.crearConsulta(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.cerrarModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error || 'Error al registrar la consulta');
      }
    });
  }

  obtenerNombreCarrera(carreraId: string): string {
    const encontrada = this.carrerasService.carreras().find((c) => c.id === carreraId);
    return encontrada ? encontrada.nombre : 'Carrera vinculada';
  }


  actualizarEstado(consulta: Consulta, event: Event) {
    const select = event.target as HTMLSelectElement;
    const nuevoEstado = select.value;

    this.consultasService.cambiarEstado(consulta.id, nuevoEstado).subscribe({
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        // Revertir el valor en la UI si falla
        select.value = consulta.estado || 'pendiente';
      }
    });
  }
}