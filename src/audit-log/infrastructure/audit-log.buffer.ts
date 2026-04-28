import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AuditLogEntity } from '../domain/entities/audit-log.entity.js';
import { AuditLogRepository } from './repositories/audit-log.repository.js';

@Injectable()
export class AuditLogBuffer implements OnModuleDestroy {
  private queue: Partial<AuditLogEntity>[] = [];
  private scheduled = false;

  constructor(private readonly repo: AuditLogRepository) {}

  /** Síncrono (~1μs): nunca await, nunca bloquea el hilo principal */
  enqueue(entry: Partial<AuditLogEntity>): void {
    this.queue.push(entry);
    if (!this.scheduled) {
      this.scheduled = true;
      // setImmediate difiere al siguiente ciclo I/O, después de enviar la respuesta HTTP
      setImmediate(() => void this.flush());
    }
  }

  private async flush(): Promise<void> {
    this.scheduled = false;
    if (this.queue.length === 0) return;

    // Swap atómico — no hay race condition en Node.js (single-threaded)
    const batch = this.queue;
    this.queue = [];

    try {
      await this.repo.insertBatch(batch);
    } catch (err) {
      // Los errores de auditoría nunca deben afectar el flujo principal
      console.error('[AuditLog] Error al insertar batch:', err);
    }
  }

  /** Graceful shutdown: vaciar el buffer antes de cerrar */
  async onModuleDestroy(): Promise<void> {
    await this.flush();
  }
}
