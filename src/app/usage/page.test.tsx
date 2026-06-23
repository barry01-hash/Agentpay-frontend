import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UsagePage from "./page";
import { apiGet, apiPost } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;
const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

describe("UsagePage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
  });

  it("renders both Record and Query landmarks", () => {
    render(<UsagePage />);
    expect(
      screen.getByRole("heading", { name: /Usage metering/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Record usage/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Query usage/i })
    ).toBeInTheDocument();
  });

  it("POSTs through the shared apiClient and shows the new total on success", async () => {
    apiPostMock.mockResolvedValueOnce({ total: 42 });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "42" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/New total: 42/);
    });
    expect(apiPostMock).toHaveBeenCalledWith("/api/v1/usage", {
      agent: "a",
      serviceId: "s",
      requests: 42,
    });
  });

  it("surfaces a backend invalid_request as a role=alert", async () => {
    apiPostMock.mockRejectedValueOnce({
      error: "invalid_request",
      message: "boom",
      requestId: "req-7",
    });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
      expect(screen.getByRole("alert")).toHaveTextContent("req-7");
    });
  });

  it("does not POST when requests parses to a non-integer", async () => {
    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    const requestsInput = screen.getByLabelText(/^Requests$/i);
    fireEvent.change(requestsInput, { target: { value: "1.5" } });
    const form = requestsInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /requests must be a positive integer/
      );
    });
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("uses apiGet for query usage and renders the result", async () => {
    apiGetMock.mockResolvedValueOnce({
      agent: "a",
      serviceId: "s",
      total: 12,
    });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getByLabelText(/^Service ID$/i, { selector: 'input[name="queryServiceId"]' }), {
      target: { value: "s" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/a \/ s: 12 request\(s\)\./i);
    });
    expect(apiGetMock).toHaveBeenCalledWith("/api/v1/usage/a/s");
  });

  it("shows a request id when the query request fails", async () => {
    apiGetMock.mockRejectedValueOnce({
      error: "invalid_request",
      message: "query boom",
      requestId: "query-9",
    });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getByLabelText(/^Service ID$/i, { selector: 'input[name="queryServiceId"]' }), {
      target: { value: "s" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("query boom");
      expect(screen.getByRole("alert")).toHaveTextContent("query-9");
    });
  });

  it("treats a 204/no-body record response as a successful record", async () => {
    apiPostMock.mockResolvedValueOnce(undefined as never);

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/^Recorded\.$/);
    });
  });

  it("surfaces a network rejection message through the alert", async () => {
    apiPostMock.mockRejectedValueOnce(new Error("network down"));

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("network down");
    });
  });
});
