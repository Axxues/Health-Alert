namespace HealthAlert.Common;

// ponytail: single envelope for all responses; add PaginatedResult only when a paged endpoint lands
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Code { get; set; } = "OK";
    public string Message { get; set; } = "";
    public T? Data { get; set; }

    public ApiResponse() { }
    public ApiResponse(bool success, string code, string message, T? data)
    {
        Success = success; Code = code; Message = message; Data = data;
    }
}

public static class ApiResponse
{
    public static ApiResponse<T> Ok<T>(T? data) => new(true, "OK", "", data);
    public static ApiResponse<object> Fail(string code, string msg) => new(false, code, msg, null);
}
