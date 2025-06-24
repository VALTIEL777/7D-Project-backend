const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    const query = `
      SELECT 
        u.userid, u.username, u.password, 
        p.employeeId, p.firstname, p.lastname, p.role, p.email 
      FROM Users u
      LEFT JOIN People p ON p.userid = u.userid
      WHERE (u.username = $1 OR p.email = $1) AND u.deletedAt IS NULL
    `;

    const result = await db.query(query, [usernameOrEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // ⚠️ Si estás usando contraseñas planas (no recomendado), usa esta comparación directa:
    if (user.password !== password) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Si usaras bcrypt:
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { userid: user.userid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        userid: user.userid,
        employeeId: user.employeeId,
        name: `${user.firstname} ${user.lastname}`,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login };
