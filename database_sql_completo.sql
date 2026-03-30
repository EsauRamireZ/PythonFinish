IF OBJECT_ID('dbo.MenuModulo', 'U') IS NOT NULL DROP TABLE dbo.MenuModulo;
IF OBJECT_ID('dbo.PermisosPerfil', 'U') IS NOT NULL DROP TABLE dbo.PermisosPerfil;
IF OBJECT_ID('dbo.Usuario', 'U') IS NOT NULL DROP TABLE dbo.Usuario;
IF OBJECT_ID('dbo.Modulo', 'U') IS NOT NULL DROP TABLE dbo.Modulo;
IF OBJECT_ID('dbo.Menu', 'U') IS NOT NULL DROP TABLE dbo.Menu;
IF OBJECT_ID('dbo.Perfil', 'U') IS NOT NULL DROP TABLE dbo.Perfil;
IF OBJECT_ID('dbo.EstadoUsuario', 'U') IS NOT NULL DROP TABLE dbo.EstadoUsuario;
GO

CREATE TABLE EstadoUsuario (
  id INT IDENTITY(1,1) PRIMARY KEY,
  strNombreEstado VARCHAR(20) NOT NULL
);
GO

CREATE TABLE Perfil (
  id INT IDENTITY(1,1) PRIMARY KEY,
  strNombrePerfil VARCHAR(80) NOT NULL,
  bitAdministrador BIT NOT NULL DEFAULT 0
);
GO

CREATE TABLE Menu (
  id INT IDENTITY(1,1) PRIMARY KEY,
  strNombreMenu VARCHAR(80) NOT NULL,
  intOrdenMenu INT NOT NULL
);
GO

CREATE TABLE Modulo (
  id INT IDENTITY(1,1) PRIMARY KEY,
  strNombreModulo VARCHAR(80) NOT NULL,
  strClaveModulo VARCHAR(50) NOT NULL UNIQUE,
  strRuta VARCHAR(120) NOT NULL
);
GO

CREATE TABLE Usuario (
  id INT IDENTITY(1,1) PRIMARY KEY,
  strNombreUsuario VARCHAR(80) NOT NULL,
  idPerfil INT NOT NULL,
  strPwd VARCHAR(120) NOT NULL,
  idEstadoUsuario INT NOT NULL,
  strCorreo VARCHAR(120) NOT NULL,
  strNumeroCelular VARCHAR(20) NOT NULL,
  strImagen VARCHAR(255) NULL,
  CONSTRAINT FK_Usuario_Perfil FOREIGN KEY (idPerfil) REFERENCES Perfil(id),
  CONSTRAINT FK_Usuario_Estado FOREIGN KEY (idEstadoUsuario) REFERENCES EstadoUsuario(id)
);
GO

CREATE TABLE PermisosPerfil (
  id INT IDENTITY(1,1) PRIMARY KEY,
  idModulo INT NOT NULL,
  idPerfil INT NOT NULL,
  bitAgregar BIT NOT NULL DEFAULT 0,
  bitEditar BIT NOT NULL DEFAULT 0,
  bitConsulta BIT NOT NULL DEFAULT 0,
  bitEliminar BIT NOT NULL DEFAULT 0,
  bitDetalle BIT NOT NULL DEFAULT 0,
  CONSTRAINT FK_PermisosPerfil_Modulo FOREIGN KEY (idModulo) REFERENCES Modulo(id),
  CONSTRAINT FK_PermisosPerfil_Perfil FOREIGN KEY (idPerfil) REFERENCES Perfil(id)
);
GO

CREATE TABLE MenuModulo (
  id INT IDENTITY(1,1) PRIMARY KEY,
  idMenu INT NOT NULL,
  idModulo INT NOT NULL,
  CONSTRAINT FK_MenuModulo_Menu FOREIGN KEY (idMenu) REFERENCES Menu(id),
  CONSTRAINT FK_MenuModulo_Modulo FOREIGN KEY (idModulo) REFERENCES Modulo(id)
);
GO

INSERT INTO EstadoUsuario (strNombreEstado) VALUES ('Activo'), ('Inactivo');
GO

INSERT INTO Perfil (strNombrePerfil, bitAdministrador) VALUES ('Administrador', 1), ('Operador', 0);
GO

INSERT INTO Menu (strNombreMenu, intOrdenMenu) VALUES
('Seguridad', 1),
('Principal 1', 2),
('Principal 2', 3);
GO

INSERT INTO Modulo (strNombreModulo, strClaveModulo, strRuta) VALUES
('Perfil', 'perfil', '/perfil'),
('Módulo', 'modulo', '/modulo'),
('Permisos Perfil', 'permisos_perfil', '/permisos-perfil'),
('Usuario', 'usuario', '/usuario'),
('Principal 1.1', 'principal_1_1', '/principal-1-1'),
('Principal 1.2', 'principal_1_2', '/principal-1-2'),
('Principal 2.1', 'principal_2_1', '/principal-2-1'),
('Principal 2.2', 'principal_2_2', '/principal-2-2');
GO

INSERT INTO MenuModulo (idMenu, idModulo) VALUES
(1,1),(1,2),(1,3),(1,4),
(2,5),(2,6),
(3,7),(3,8);
GO

INSERT INTO Usuario (strNombreUsuario, idPerfil, strPwd, idEstadoUsuario, strCorreo, strNumeroCelular, strImagen)
VALUES ('admin', 1, '12345', 1, 'admin@demo.com', '7710000000', NULL);
GO

INSERT INTO PermisosPerfil (idModulo, idPerfil, bitAgregar, bitEditar, bitConsulta, bitEliminar, bitDetalle)
SELECT id, 1, 1, 1, 1, 1, 1 FROM Modulo;
GO

INSERT INTO PermisosPerfil (idModulo, idPerfil, bitAgregar, bitEditar, bitConsulta, bitEliminar, bitDetalle)
VALUES
(1, 2, 0, 0, 1, 0, 1),
(4, 2, 0, 0, 1, 0, 1),
(5, 2, 0, 0, 1, 0, 0),
(7, 2, 0, 0, 1, 0, 0);
GO
