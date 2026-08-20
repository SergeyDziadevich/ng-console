import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { TicketService } from './ticket.service';
import { Ticket, TicketStatus, Comment } from "@ng-console/shared/models";
import { environment } from "@env/environment";

describe('TicketService', () => {
  let service: TicketService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/tickets`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TicketService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TicketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CRUD operations', () => {
    it('should get a ticket by ID', () => {
      const mockTicket: Partial<Ticket> = { id: '1', title: 'Test Ticket' };

      service.getTicket('1').subscribe((ticket) => {
        expect(ticket).toEqual(mockTicket);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTicket);
    });

    it('should create a new ticket', () => {
      const mockTicket: Partial<Ticket> = { title: 'New Ticket', status: TicketStatus.TODO };
      const createdTicket: Partial<Ticket> = { id: '1', ...mockTicket };

      service.createTicket(mockTicket).subscribe((ticket) => {
        expect(ticket).toEqual(createdTicket);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockTicket);
      req.flush(createdTicket);
    });

    it('should update an existing ticket', () => {
      const mockTicket: Partial<Ticket> = { title: 'Updated Ticket' };
      const updatedTicket: Partial<Ticket> = { id: '1', ...mockTicket };

      service.updateTicket('1', mockTicket).subscribe((ticket) => {
        expect(ticket).toEqual(updatedTicket);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockTicket);
      req.flush(updatedTicket);
    });

    it('should delete a ticket', () => {
      service.deleteTicket('1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should add a comment to a ticket', () => {
      const mockComment: Partial<Comment> = { id: 10, text: 'New Comment' };

      service.addComment('1', 'New Comment').subscribe((comment) => {
        expect(comment).toEqual(mockComment);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/comments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ text: 'New Comment' });
      req.flush(mockComment);
    });
  });
});
