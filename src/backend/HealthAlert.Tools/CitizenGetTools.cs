namespace HealthAlert.Tools;

public class CitizenGetTools
{
    public object Ask(string? q) =>
        new { reply = $"Kumusta! Para sa '{q}': magpahinga, uminom ng fluids, at pumunta sa RHU kung may lagnat >2 araw." };
}
