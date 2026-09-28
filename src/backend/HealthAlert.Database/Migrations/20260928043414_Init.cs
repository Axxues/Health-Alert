using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthAlert.Database.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblAlerts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiseaseId = table.Column<long>(type: "bigint", nullable: true),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAlerts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblAuditTrail",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAuditTrail", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblCases",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiseaseId = table.Column<long>(type: "bigint", nullable: true),
                    FeedId = table.Column<long>(type: "bigint", nullable: true),
                    SourceKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Count = table.Column<double>(type: "float", nullable: true),
                    ReportedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblCases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblDiseases",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblDiseases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblFeeds",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblFeeds", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblForecastRuns",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiseaseId = table.Column<long>(type: "bigint", nullable: true),
                    Probability = table.Column<double>(type: "float", nullable: true),
                    Band = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Drivers = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblForecastRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblOutbox",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdempotencyKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblOutbox", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblPlaybookExecutions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlaybookId = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Log = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPlaybookExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblPlaybooks",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPlaybooks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblRagDocs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Doc = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Chapter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Page = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblRagDocs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tblUsers",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblUsers", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblAlerts");

            migrationBuilder.DropTable(
                name: "tblAuditTrail");

            migrationBuilder.DropTable(
                name: "tblCases");

            migrationBuilder.DropTable(
                name: "tblDiseases");

            migrationBuilder.DropTable(
                name: "tblFeeds");

            migrationBuilder.DropTable(
                name: "tblForecastRuns");

            migrationBuilder.DropTable(
                name: "tblOutbox");

            migrationBuilder.DropTable(
                name: "tblPlaybookExecutions");

            migrationBuilder.DropTable(
                name: "tblPlaybooks");

            migrationBuilder.DropTable(
                name: "tblRagDocs");

            migrationBuilder.DropTable(
                name: "tblUsers");
        }
    }
}
