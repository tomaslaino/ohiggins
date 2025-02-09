from flask import Flask, render_template, redirect, url_for, request, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate  # Importa Flask-Migrate
import os, re, json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo  # För att sätta Uruguayansk tid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'din_hemliga_nyckel'  # Ändra till din egen hemliga nyckel!
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ohiggins.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=365)

db = SQLAlchemy(app)
migrate = Migrate(app, db)  # Initiera Flask-Migrate

login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = ""

# Gör datetime, uruguay_tz och ZoneInfo tillgängliga i mallarna
app.jinja_env.globals.update(
    datetime=datetime,
    uruguay_tz=ZoneInfo("America/Montevideo"),
    ZoneInfo=ZoneInfo
)

# ------------------------------
# Databasmodeller
# ------------------------------

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # 'admin' eller 'usuario'
    first_name = db.Column(db.String(150), nullable=False)
    last_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    section = db.Column(db.String(100), nullable=False)
    last_description = db.Column(db.Text, default="")
    last_product_id = db.Column(db.Integer, nullable=True)
    last_variety = db.Column(db.String(100), nullable=True)
    approved = db.Column(db.Boolean, default=False)  # Nuevo campo: la cuenta debe ser aprobada

class Transaccion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(500), nullable=False)
    monto = db.Column(db.Float, nullable=False)
    tipo = db.Column(db.String(20), nullable=False)     # "ingreso" o "egreso"
    moneda = db.Column(db.String(10), nullable=False)     # "UYU" o "USD"
    fecha = db.Column(db.DateTime, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    fruit = db.Column(db.String(50), nullable=True)       # Para ingreso: producto (fruta/verdura); para egreso: categoría de egreso
    variety = db.Column(db.String(100), nullable=True)    # Solo si es relevante (fruta/verdura)
    cantidad = db.Column(db.Float, nullable=True)         # Solo para ingreso
    unidad = db.Column(db.String(50), nullable=True)      # "cajones" o "kilos" (ingreso)
    section = db.Column(db.String(100), nullable=True)    # Indica a qué finca pertenece la transacción
    updated_at = db.Column(db.DateTime, nullable=True)
    update_history = db.Column(db.Text, nullable=True)
    deleted = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref='transacciones')

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # "Fruta" o "Verdura"
    added_at = db.Column(db.DateTime, default=datetime.now(ZoneInfo("America/Montevideo")))
    added_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    varieties = db.relationship('Variety', backref='product', lazy=True)

class Variety(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.now(ZoneInfo("America/Montevideo")))
    added_by = db.Column(db.Integer, db.ForeignKey('user.id'))

# ------------------------------
# Funciones auxiliares y user loader
# ------------------------------

@login_manager.user_loader
def load_user(user_id):
    # Usamos db.session.get() (recomendado en SQLAlchemy 2.0)
    return db.session.get(User, int(user_id))

def parse_fecha(fecha_str):
    try:
        # Retorna la fecha en hora de Montevideo
        return datetime.fromisoformat(fecha_str).astimezone(ZoneInfo("America/Montevideo"))
    except Exception:
        return None

# Context processor para inyectar el conteo de usuarios pendientes en las plantillas
@app.context_processor
def inject_pending_count():
    if current_user.is_authenticated and current_user.role == 'admin':
        pending_count = User.query.filter_by(approved=False).count()
        return {'pending_count': pending_count}
    return {}

# ------------------------------
# Rutas
# ------------------------------

@app.route('/')
def bienvenida():
    return render_template('bienvenida.html')

@app.route('/contabilidad')
@login_required
def contabilidad():
    # Obtener parámetros de filtro
    tipo_filter = request.args.get('tipo')
    moneda_filter = request.args.get('moneda')
    fecha_from = request.args.get('fecha_from')
    fecha_to = request.args.get('fecha_to')
    section_filter = request.args.get('section')
    producto_filter = request.args.get('producto')
    variedad_filter = request.args.get('variedad')
    expense_category = request.args.get('expense_category')
    nombre_filter = request.args.get('nombre')
    
    # Si el usuario no es admin, mostrar solo transacciones de su sección
    if current_user.role == 'admin':
        query = Transaccion.query.filter_by(deleted=False)
        if section_filter:
            query = query.filter_by(section=section_filter)
    else:
        query = Transaccion.query.filter_by(section=current_user.section, deleted=False)
    if tipo_filter in ['ingreso', 'egreso']:
        query = query.filter_by(tipo=tipo_filter)
    if moneda_filter in ['UYU', 'USD']:
        query = query.filter_by(moneda=moneda_filter)
    if fecha_from:
        try:
            f_from = datetime.fromisoformat(fecha_from).astimezone(ZoneInfo("America/Montevideo"))
            query = query.filter(Transaccion.fecha >= f_from)
        except Exception:
            pass
    if fecha_to:
        try:
            f_to = datetime.fromisoformat(fecha_to).astimezone(ZoneInfo("America/Montevideo"))
            query = query.filter(Transaccion.fecha <= f_to)
        except Exception:
            pass
    if producto_filter:
        query = query.filter(Transaccion.fruit.ilike(f"%{producto_filter}%"))
    if variedad_filter:
        query = query.filter(Transaccion.variety.ilike(f"%{variedad_filter}%"))
    if expense_category:
        query = query.filter(Transaccion.fruit.ilike(f"%{expense_category}%"))
    if nombre_filter:
        query = query.join(User).filter((User.first_name.ilike(f"%{nombre_filter}%")) | (User.last_name.ilike(f"%{nombre_filter}%")))
    
    transacciones = query.order_by(Transaccion.fecha.desc()).all()
    
    total_ingresos_uyu = sum(t.monto for t in transacciones if t.tipo == 'ingreso' and t.moneda == 'UYU')
    total_egresos_uyu = sum(t.monto for t in transacciones if t.tipo == 'egreso' and t.moneda == 'UYU')
    total_ingresos_usd = sum(t.monto for t in transacciones if t.tipo == 'ingreso' and t.moneda == 'USD')
    total_egresos_usd = sum(t.monto for t in transacciones if t.tipo == 'egreso' and t.moneda == 'USD')
    
    # Crear listas con valores únicos para los filtros
    nombres = sorted({ f"{t.user.first_name} {t.user.last_name}" for t in transacciones if t.user and t.user.first_name })
    secciones = sorted({ t.section for t in transacciones if t.section })
    tipos = sorted({ t.tipo for t in transacciones if t.tipo })
    productos = sorted({ t.fruit for t in transacciones if t.fruit and t.tipo == 'ingreso' })
    variedades = sorted({ t.variety for t in transacciones if t.variety })
    monedas = sorted({ t.moneda for t in transacciones if t.moneda })
    
    return render_template('contabilidad.html',
                           transacciones=transacciones,
                           total_ingresos_uyu=total_ingresos_uyu,
                           total_egresos_uyu=total_egresos_uyu,
                           total_ingresos_usd=total_ingresos_usd,
                           total_egresos_usd=total_egresos_usd,
                           tipo_filter=tipo_filter,
                           moneda_filter=moneda_filter,
                           fecha_from=fecha_from,
                           fecha_to=fecha_to,
                           section_filter=section_filter,
                           producto_filter=producto_filter,
                           variedad_filter=variedad_filter,
                           expense_category=expense_category,
                           nombre_filter=nombre_filter,
                           nombres=nombres,
                           secciones=secciones,
                           tipos=tipos,
                           productos=productos,
                           variedades=variedades,
                           monedas=monedas)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            if not user.approved:
                flash("Tu cuenta aún no está aprobada. Contacta al administrador.", "warning")
                return redirect(url_for('login'))
            login_user(user, remember=True)
            flash("Inicio de sesión exitoso.", "success")
            return redirect(url_for('contabilidad'))
        else:
            flash("Nombre de usuario o contraseña incorrectos.", "danger")
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash("Has cerrado sesión.", "info")
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        flash("Ya has iniciado sesión. Cierra sesión para registrar un nuevo usuario.", "warning")
        return redirect(url_for('contabilidad'))
    if request.method == 'POST':
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password')
        if len(password) < 4:
            flash("La contraseña debe tener al menos 4 caracteres.", "danger")
            return redirect(url_for('register'))
        role = request.form.get('role')
        if role == 'usuario':
            section = request.form.get('section')
            approved = False  # Los usuarios comunes deben ser aprobados
        else:
            admin_secret = request.form.get('admin_secret')
            if admin_secret != 'tomtenärfartillallabarnen':
                flash("Contraseña secreta de administrador incorrecta.", "danger")
                return redirect(url_for('register'))
            section = "Admin"
            approved = True  # Los administradores se aprueban directamente
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            flash("Correo electrónico no válido.", "danger")
            return redirect(url_for('register'))
        if User.query.filter_by(email=email).first():
            flash("El correo electrónico ya está en uso.", "danger")
            return redirect(url_for('register'))
        if User.query.filter_by(username=username).first():
            flash("El nombre de usuario ya existe.", "danger")
            return redirect(url_for('register'))
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=username,
            password=generate_password_hash(password, method='pbkdf2:sha256'),
            role=role,
            section=section,
            approved=approved
        )
        db.session.add(new_user)
        db.session.commit()
        if approved:
            flash("Registro exitoso. Ahora puedes iniciar sesión.", "success")
        else:
            flash("Registro exitoso. Espera a que un administrador apruebe tu cuenta.", "info")
        return redirect(url_for('login'))
    return render_template('register.html', signup_mode=True)

@app.route('/add_ingreso', methods=['GET', 'POST'])
@login_required
def add_ingreso():
    if request.method == 'POST':
        monto = request.form.get('monto')
        moneda = request.form.get('moneda')
        fecha_input = request.form.get('fecha')
        if fecha_input:
            fecha = parse_fecha(fecha_input)
        else:
            fecha = datetime.now(ZoneInfo("America/Montevideo"))
        cantidad = request.form.get('cantidad')
        unidad = request.form.get('unidad')
        try:
            monto = float(monto)
        except ValueError:
            flash("Monto inválido.", "danger")
            return redirect(url_for('add_ingreso'))
        fruit_category = request.form.get('fruit_category')
        if fruit_category == "Fruta":
            product_id = request.form.get('fruit_id')
            variety = request.form.get('variety_select')
            product_obj = db.session.get(Product, int(product_id)) if product_id else None
            product = product_obj.name if product_obj else ""
        elif fruit_category == "Verdura":
            product_id = request.form.get('verdura_id')
            variety = request.form.get('variety_select_verdura')
            product_obj = db.session.get(Product, int(product_id)) if product_id else None
            product = product_obj.name if product_obj else ""
        else:
            product = request.form.get('producto_otro')
            variety = None
        try:
            if fruit_category in ["Fruta", "Verdura"]:
                cantidad = float(cantidad)
            else:
                cantidad = None
                unidad = None
        except (ValueError, TypeError):
            cantidad = None
            unidad = None
        descripcion = request.form.get('descripcion') or ""
        current_user.last_description = descripcion
        if fruit_category == "Fruta" and product_id:
            current_user.last_product_id = int(product_id)
            current_user.last_variety = variety
        if current_user.role != 'admin':
            section = current_user.section
        else:
            section = request.form.get('section_expense_ingreso') or current_user.section
        new_trans = Transaccion(
            descripcion=descripcion,
            monto=monto,
            tipo="ingreso",
            moneda=moneda,
            fecha=fecha,
            user_id=current_user.id,
            fruit=product,
            variety=variety,
            cantidad=cantidad,
            unidad=unidad,
            section=section
        )
        db.session.add(new_trans)
        db.session.commit()
        flash("Ingreso agregado exitosamente.", "success")
        return redirect(url_for('contabilidad'))
    else:
        fruits = Product.query.filter_by(type="Fruta").all()
        verduras = Product.query.filter_by(type="Verdura").all()
        fruit_varieties = { prod.id: [v.name for v in prod.varieties] for prod in fruits }
        verdura_varieties = { prod.id: [v.name for v in prod.varieties] for prod in verduras }
        return render_template('add_ingreso.html',
                               fruits=fruits,
                               verduras=verduras,
                               fruit_varieties=json.dumps(fruit_varieties),
                               verdura_varieties=json.dumps(verdura_varieties),
                               default_product_id=current_user.last_product_id,
                               default_variety=current_user.last_variety)

@app.route('/add_egreso', methods=['GET', 'POST'])
@login_required
def add_egreso():
    if request.method == 'POST':
        monto = request.form.get('monto')
        moneda = request.form.get('moneda')
        fecha_input = request.form.get('fecha')
        if fecha_input:
            fecha = parse_fecha(fecha_input)
        else:
            fecha = datetime.now(ZoneInfo("America/Montevideo"))
        try:
            monto = float(monto)
        except ValueError:
            flash("Monto inválido.", "danger")
            return redirect(url_for('add_egreso'))
        expense_category = request.form.get('expense_category')
        if current_user.role == 'admin':
            section = request.form.get('section_expense')
            if not section:
                flash("Debes seleccionar la sección para el egreso.", "danger")
                return redirect(url_for('add_egreso'))
        else:
            section = current_user.section
        descripcion = request.form.get('descripcion') or ""
        current_user.last_description = descripcion
        new_trans = Transaccion(
            descripcion=descripcion,
            monto=monto,
            tipo="egreso",
            moneda=moneda,
            fecha=fecha,
            user_id=current_user.id,
            fruit=expense_category,
            section=section
        )
        db.session.add(new_trans)
        db.session.commit()
        flash("Egreso agregado exitosamente.", "success")
        return redirect(url_for('contabilidad'))
    return render_template('add_egreso.html')

@app.route('/edit_transaction/<int:trans_id>', methods=['GET', 'POST'])
@login_required
def edit_transaction(trans_id):
    trans = db.session.get(Transaccion, trans_id)
    if not trans:
        flash("La transacción no fue encontrada.", "danger")
        return redirect(url_for('contabilidad'))
    # Solo el usuario creador o un admin pueden editar
    if current_user.role != 'admin' and current_user.id != trans.user_id:
        flash("No tienes permiso para editar esta transacción.", "danger")
        return redirect(url_for('contabilidad'))
    if request.method == 'POST':
        old_values = f"Monto: {trans.monto}, Cantidad: {trans.cantidad}, Unidad: {trans.unidad}, Descripción: {trans.descripcion}"
        trans.descripcion = request.form.get('descripcion')
        monto = request.form.get('monto')
        trans.moneda = request.form.get('moneda')
        fecha_input = request.form.get('fecha')
        if fecha_input:
            parsed_fecha = parse_fecha(fecha_input)
            if parsed_fecha:
                trans.fecha = parsed_fecha
        try:
            trans.monto = float(monto)
        except ValueError:
            flash("Monto inválido.", "danger")
            return redirect(url_for('edit_transaction', trans_id=trans_id))
        fruit_category = request.form.get('fruit_category')
        if fruit_category == "Fruta":
            product_id = request.form.get('fruit_id')
            trans.fruit = db.session.get(Product, int(product_id)).name if product_id else trans.fruit
            trans.variety = request.form.get('variety_select')
            try:
                trans.cantidad = float(request.form.get('cantidad'))
            except (ValueError, TypeError):
                trans.cantidad = None
            trans.unidad = request.form.get('unidad')
        elif fruit_category == "Verdura":
            trans.fruit = request.form.get('datalist_product')
            trans.variety = request.form.get('variety')
            try:
                trans.cantidad = float(request.form.get('cantidad'))
            except (ValueError, TypeError):
                trans.cantidad = None
            trans.unidad = request.form.get('unidad')
        else:
            if trans.tipo == 'egreso':
                trans.fruit = request.form.get('expense_category')
            else:
                trans.fruit = request.form.get('producto_otro')
            trans.variety = None
            trans.cantidad = None
            trans.unidad = None
        trans.tipo = request.form.get('tipo')
        if current_user.role == 'admin' and trans.tipo == 'egreso':
            trans.section = request.form.get('section_expense')
        new_values = f"Monto: {trans.monto}, Cantidad: {trans.cantidad}, Unidad: {trans.unidad}, Descripción: {trans.descripcion}"
        trans.update_history = (trans.update_history or "") + f"\n[{datetime.now(ZoneInfo('America/Montevideo')).strftime('%d/%m/%Y %H:%M:%S')}] Antes: {old_values} | Después: {new_values}"
        trans.updated_at = datetime.now(ZoneInfo("America/Montevideo"))
        db.session.commit()
        flash("Transacción actualizada exitosamente.", "success")
        return redirect(url_for('contabilidad'))
    else:
        fruits = Product.query.filter_by(type="Fruta").all()
        fruit_varieties = { prod.id: [v.name for v in prod.varieties] for prod in fruits }
        return render_template('edit_transaction.html', trans=trans, fruits=fruits, fruit_varieties=json.dumps(fruit_varieties))
    
@app.route('/delete_transaction/<int:trans_id>', methods=['POST'])
@login_required
def delete_transaction(trans_id):
    trans = db.session.get(Transaccion, trans_id)
    if not trans:
        flash("La transacción no fue encontrada.", "danger")
        return redirect(url_for('contabilidad'))
    if current_user.role != 'admin' and current_user.id != trans.user_id:
        flash("No tienes permiso para eliminar esta transacción.", "danger")
        return redirect(url_for('contabilidad'))
    trans.deleted = True
    db.session.commit()
    flash("Transacción eliminada (soft delete).", "success")
    return redirect(url_for('contabilidad'))

@app.route('/deleted_transactions')
@login_required
def deleted_transactions():
    if current_user.role != 'admin':
        flash("No tienes permiso para ver esta página.", "danger")
        return redirect(url_for('contabilidad'))
    transacciones = Transaccion.query.filter_by(deleted=True).order_by(Transaccion.fecha.desc()).all()
    return render_template('deleted_transactions.html', transacciones=transacciones)

@app.route('/restore_transaction/<int:trans_id>')
@login_required
def restore_transaction(trans_id):
    if current_user.role != 'admin':
        flash("No tienes permiso para realizar esta acción.", "danger")
        return redirect(url_for('contabilidad'))
    trans = db.session.get(Transaccion, trans_id)
    if not trans:
        flash("La transacción no fue encontrada.", "danger")
        return redirect(url_for('deleted_transactions'))
    trans.deleted = False
    db.session.commit()
    flash("Transacción restaurada exitosamente.", "success")
    return redirect(url_for('deleted_transactions'))

@app.route('/permanent_delete_transaction/<int:trans_id>', methods=['POST'])
@login_required
def permanent_delete_transaction(trans_id):
    if current_user.role != 'admin':
        flash("No tienes permiso para realizar esta acción.", "danger")
        return redirect(url_for('contabilidad'))
    trans = db.session.get(Transaccion, trans_id)
    if not trans:
        flash("La transacción no fue encontrada.", "danger")
        return redirect(url_for('deleted_transactions'))
    db.session.delete(trans)
    db.session.commit()
    flash("Transacción eliminada permanentemente.", "success")
    return redirect(url_for('deleted_transactions'))

@app.route('/manage_products', methods=['GET', 'POST'])
@login_required
def manage_products():
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'add_product':
            product_name = request.form.get('product_name').strip()
            product_type = request.form.get('product_type')
            if product_name and product_type in ["Fruta", "Verdura"]:
                existing_product = Product.query.filter_by(name=product_name, type=product_type).first()
                if existing_product:
                    flash("Ya existe un producto con el nombre '{}' en {}.".format(product_name, product_type), "warning")
                else:
                    new_product = Product(name=product_name, type=product_type, added_by=current_user.id)
                    db.session.add(new_product)
                    db.session.commit()
                    flash("Producto agregado exitosamente.", "success")
            else:
                flash("Debes ingresar el nombre del producto y seleccionar el tipo.", "danger")
        elif action == 'add_variety':
            product_id = request.form.get('product_id')
            variety_name = request.form.get('variety_name')
            if product_id and variety_name:
                variety_name = variety_name.strip()
                existing_variety = Variety.query.filter_by(product_id=int(product_id), name=variety_name).first()
                if existing_variety:
                    flash("Ya existe una variedad '{}' para este producto.".format(variety_name), "warning")
                else:
                    new_variety = Variety(product_id=int(product_id), name=variety_name, added_by=current_user.id)
                    db.session.add(new_variety)
                    db.session.commit()
                    flash("Variedad agregada exitosamente.", "success")
            else:
                flash("Debes seleccionar un producto y escribir el nombre de la variedad.", "danger")
        return redirect(url_for('manage_products'))
    products = Product.query.all()
    return render_template('manage_products.html', products=products)

@app.route('/delete_product/<int:product_id>', methods=['POST'])
@login_required
def delete_product(product_id):
    if current_user.role != 'admin':
        flash("No tienes permiso para eliminar productos.", "danger")
        return redirect(url_for('manage_products'))
    product = db.session.get(Product, product_id)
    if not product:
        flash("El producto no fue encontrado.", "danger")
        return redirect(url_for('manage_products'))
    transacciones = Transaccion.query.filter_by(fruit=product.name).all()
    if transacciones:
        flash("El producto no se puede eliminar porque se ha utilizado en transacciones.", "warning")
    else:
        db.session.delete(product)
        db.session.commit()
        flash("Producto eliminado exitosamente.", "success")
    return redirect(url_for('manage_products'))

@app.route('/delete_variety/<int:variety_id>', methods=['POST'])
@login_required
def delete_variety(variety_id):
    if current_user.role != 'admin':
        flash("No tienes permiso para eliminar varianzas.", "danger")
        return redirect(url_for('manage_products'))
    variety = db.session.get(Variety, variety_id)
    if not variety:
        flash("La variedad no fue encontrada.", "danger")
        return redirect(url_for('manage_products'))
    transacciones = Transaccion.query.filter_by(variety=variety.name).all()
    if transacciones:
        flash("La variedad no se puede eliminar porque se ha utilizado en transacciones.", "warning")
    else:
        db.session.delete(variety)
        db.session.commit()
        flash("Variedad eliminada exitosamente.", "success")
    return redirect(url_for('manage_products'))

@app.route('/users', methods=['GET'])
def list_users():
    if current_user.is_authenticated and current_user.role == 'admin':
        users_list = User.query.order_by(User.section, User.username).all()
        return render_template('users.html', users=users_list)
    else:
        flash("No tienes permiso para ver esta página.", "danger")
        return redirect(url_for('contabilidad'))

@app.route('/edit_user/<int:user_id>', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
    if current_user.role != 'admin':
        flash("No tienes permiso para ver esta página.", "danger")
        return redirect(url_for('contabilidad'))
    user = db.session.get(User, user_id)
    if not user:
        flash("El usuario no fue encontrado.", "danger")
        return redirect(url_for('list_users'))
    if request.method == 'POST':
        user.first_name = request.form.get('first_name')
        user.last_name = request.form.get('last_name')
        email = request.form.get('email')
        username = request.form.get('username')
        role = request.form.get('role')
        section = request.form.get('section')
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            flash("Correo electrónico no válido.", "danger")
            return redirect(url_for('edit_user', user_id=user_id))
        existing_user = User.query.filter(User.email == email, User.id != user_id).first()
        if existing_user:
            flash("El correo electrónico ya está en uso.", "danger")
            return redirect(url_for('edit_user', user_id=user_id))
        existing_username = User.query.filter(User.username == username, User.id != user_id).first()
        if existing_username:
            flash("El nombre de usuario ya está en uso.", "danger")
            return redirect(url_for('edit_user', user_id=user_id))
        user.email = email
        user.username = username
        user.role = role
        user.section = section
        db.session.commit()
        flash("Usuario actualizado exitosamente.", "success")
        return redirect(url_for('list_users'))
    return render_template('edit_user.html', user=user)

@app.route('/delete_user/<int:user_id>', methods=['POST'])
@login_required
def delete_user(user_id):
    if current_user.role != 'admin':
        flash("No tienes permiso para realizar esta acción.", "danger")
        return redirect(url_for('contabilidad'))
    user = db.session.get(User, user_id)
    if not user:
        flash("El usuario no fue encontrado.", "danger")
        return redirect(url_for('list_users'))
    if user.id == current_user.id:
        flash("No puedes eliminar tu propio usuario.", "danger")
        return redirect(url_for('list_users'))
    db.session.delete(user)
    db.session.commit()
    flash("Usuario eliminado exitosamente.", "success")
    return redirect(url_for('list_users'))

# --- Nuevas rutas para usuarios pendientes ---

@app.route('/pending_users')
@login_required
def pending_users():
    if current_user.role != 'admin':
        flash("No tienes permiso para ver esta página.", "danger")
        return redirect(url_for('contabilidad'))
    pending_users = User.query.filter_by(approved=False).all()
    return render_template('pending_users.html', pending_users=pending_users)

@app.route('/approve_user/<int:user_id>', methods=['POST'])
@login_required
def approve_user(user_id):
    if current_user.role != 'admin':
        flash("No tienes permiso para realizar esta acción.", "danger")
        return redirect(url_for('contabilidad'))
    user = db.session.get(User, user_id)
    if not user:
        flash("El usuario no fue encontrado.", "danger")
        return redirect(url_for('pending_users'))
    user.approved = True
    db.session.commit()
    flash(f"El usuario {user.username} ha sido aprobado.", "success")
    return redirect(url_for('pending_users'))

# ------------------------------
# Programa principal
# ------------------------------
if __name__ == '__main__':
    # Si no usas Flask-Migrate y estás en desarrollo, puedes borrar la base de datos y crear una nueva.
    # Por ejemplo: os.remove('ohiggins.db')  (¡ATENCIÓN! Esto borrará todos los datos)
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username='admin').first():
            admin = User(
                first_name="Admin",
                last_name="User",
                email="admin@example.com",
                username="admin",
                password=generate_password_hash("admin123", method='pbkdf2:sha256'),
                role="admin",
                section="Admin",
                approved=True
            )
            db.session.add(admin)
            db.session.commit()
    app.run(debug=True)
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
