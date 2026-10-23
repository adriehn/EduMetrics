import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PerfilService } from '../../services/perfil.service';
import { AuthService } from '../../services/auth.service';
import { PerfilData, ActualizarPerfilDTO, CambiarPasswordDTO } from '../../models';

export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('nuevaPassword')?.value;
  const confirmar = control.get('confirmarPassword')?.value;
  if (!nueva || !confirmar) return null;
  return nueva === confirmar ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private perfilService = inject(PerfilService);
  private authService = inject(AuthService);

  perfil = signal<PerfilData | null>(null);
  isLoading = signal<boolean>(false);
  isSubmittingDatos = signal<boolean>(false);
  isSubmittingPass = signal<boolean>(false);
  isUploadingAvatar = signal<boolean>(false);

  mensajeExitoDatos = signal<string | null>(null);
  mensajeErrorDatos = signal<string | null>(null);

  mensajeExitoPass = signal<string | null>(null);
  mensajeErrorPass = signal<string | null>(null);

  mostrarModalEmail = signal<boolean>(false);
  nuevoEmailPendiente = signal<string>('');

  // Formulario 1: Datos de la institución
  formDatos = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]]
  });

  // Formulario 2: Modificación de clave
  formPassword = this.fb.group(
    {
      passwordActual: ['', [Validators.required]],
      nuevaPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).*$/) // Al menos 1 mayúscula y 1 número
        ]
      ],
      confirmarPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatchValidator }
  );

  ngOnInit() {
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.isLoading.set(true);
    this.perfilService.obtenerPerfil().subscribe({
      next: (data) => {
        this.perfil.set(data);
        this.formDatos.patchValue({
          nombre: data.nombre,
          email: data.email
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 3 * 1024 * 1024) {
      this.mensajeErrorDatos.set('La imagen no debe superar los 3 MB.');
      return;
    }

    this.isUploadingAvatar.set(true);
    this.mensajeErrorDatos.set(null);
    this.perfilService.subirAvatar(file).subscribe({
      next: (res) => {
        this.isUploadingAvatar.set(false);
        this.perfil.update((p) => (p ? { ...p, avatar_url: res.avatar_url } : p));

        // Notificar al AuthService
        const user = this.authService.currentUser();
        if (user) {
          this.authService.actualizarUsuario({
            ...user,
            avatar_url: res.avatar_url
          });
        }
      },
      error: (err) => {
        this.isUploadingAvatar.set(false);
        this.mensajeErrorDatos.set(err.error?.error || 'Error al subir imagen');
      }
    });
  }




  guardarDatos() {
    if (this.formDatos.invalid) {
      this.formDatos.markAllAsTouched();
      return;
    }

    const emailIngresado = this.formDatos.value.email?.trim().toLowerCase();
    const emailActual = this.perfil()?.email?.toLowerCase();

    // Si el email cambió, frenamos y abrimos el modal de confirmación
    if (emailIngresado && emailIngresado !== emailActual) {
      this.nuevoEmailPendiente.set(emailIngresado);
      this.mostrarModalEmail.set(true);
      return;
    }

    // Si solo cambió el nombre, guardamos directo
    this.ejecutarActualizacionDatos();
  }

  cancelarCambioEmail() {
    // Revertimos el input al email original y cerramos modal
    if (this.perfil()?.email) {
      this.formDatos.patchValue({ email: this.perfil()!.email });
    }
    this.mostrarModalEmail.set(false);
  }

  confirmarCambioEmail() {
    this.mostrarModalEmail.set(false);
    this.ejecutarActualizacionDatos();
  }

  private ejecutarActualizacionDatos() {
    this.isSubmittingDatos.set(true);
    this.mensajeExitoDatos.set(null);
    this.mensajeErrorDatos.set(null);

    const val = this.formDatos.getRawValue();

    this.perfilService.actualizarDatos({ nombre: val.nombre!, email: val.email! }).subscribe({
      next: (res) => {
        this.isSubmittingDatos.set(false);
        this.mensajeExitoDatos.set('Datos actualizados correctamente.');
        this.perfil.set(res.institucion);

        // Actualizar estado en sesión
        const userActual = this.authService.currentUser();
        if (userActual) {
          const userActualizado = {
            ...userActual,
            nombre: res.institucion.nombre,
            email: res.institucion.email
          };
          this.authService.currentUser.set(userActualizado);
          localStorage.setItem('edumetrics_user', JSON.stringify(userActualizado));
        }
      },
      error: (err) => {
        this.isSubmittingDatos.set(false);
        this.mensajeErrorDatos.set(err.error?.error || 'Error al actualizar datos.');
      }
    });
  }


  guardarPassword() {
    if (this.formPassword.invalid) {
      this.formPassword.markAllAsTouched();
      return;
    }

    this.isSubmittingPass.set(true);
    this.mensajeExitoPass.set(null);
    this.mensajeErrorPass.set(null);

    const val = this.formPassword.getRawValue();

    this.perfilService.cambiarPassword({
      passwordActual: val.passwordActual!,
      nuevaPassword: val.nuevaPassword!
    }).subscribe({
      next: () => {
        this.isSubmittingPass.set(false);
        this.mensajeExitoPass.set('Contraseña modificada con éxito.');
        this.formPassword.reset();
      },
      error: (err) => {
        this.isSubmittingPass.set(false);
        this.mensajeErrorPass.set(err.error?.error || 'Error al modificar contraseña.');
      }
    });
  }
}