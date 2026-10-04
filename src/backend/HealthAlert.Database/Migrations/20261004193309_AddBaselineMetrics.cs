using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthAlert.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddBaselineMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "BaselineMae",
                table: "tblForecastModels",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BaselineName",
                table: "tblForecastModels",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "BaselineRmse",
                table: "tblForecastModels",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BaselineMae",
                table: "tblForecastModels");

            migrationBuilder.DropColumn(
                name: "BaselineName",
                table: "tblForecastModels");

            migrationBuilder.DropColumn(
                name: "BaselineRmse",
                table: "tblForecastModels");
        }
    }
}
