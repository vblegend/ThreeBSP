var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "THREE", "CSG"], function(require, exports) {
    var EPSILON = 1e-5, COPLANAR = 0, FRONT = 1, BACK = 2, SPANNING = 3;

    var ThreeBSP = (function () {
        function ThreeBSP(geometry, matrix) {
            if (geometry instanceof THREE.Geometry) {
                this.matrix = matrix || new THREE.Matrix4();
            } else if (geometry instanceof THREE.Mesh) {
                geometry.updateMatrix();
                this.matrix = geometry.matrix.clone();
                geometry = geometry.geometry;
            } else if (geometry instanceof ThreeBSP.Node) {
                this.tree = geometry;
                this.matrix = matrix || new THREE.Matrix4();
                return this;
            } else {
                throw 'ThreeBSP: Given geometry is unsupported';
            }

            matrix = this.matrix;

            var i, _length_i, face, vertex, faceVertexUvs, uvs, polygon, polygons = [];

            for (i = 0, _length_i = geometry.faces.length; i < _length_i; i++) {
                face = geometry.faces[i];
                faceVertexUvs = geometry.faceVertexUvs[0][i];
                polygon = new ThreeBSP.Polygon;

                if (face instanceof THREE.Face3) {
                    vertex = geometry.vertices[face.a];
                    uvs = faceVertexUvs ? new THREE.Vector2(faceVertexUvs[0].x, faceVertexUvs[0].y) : null;
                    vertex = new ThreeBSP.Vertex(vertex.x, vertex.y, vertex.z, face.vertexNormals[0], uvs);
                    vertex.applyMatrix4(matrix);
                    polygon.vertices.push(vertex);

                    vertex = geometry.vertices[face.b];
                    uvs = faceVertexUvs ? new THREE.Vector2(faceVertexUvs[1].x, faceVertexUvs[1].y) : null;
                    vertex = new ThreeBSP.Vertex(vertex.x, vertex.y, vertex.z, face.vertexNormals[2], uvs);
                    vertex.applyMatrix4(matrix);
                    polygon.vertices.push(vertex);

                    vertex = geometry.vertices[face.c];
                    uvs = faceVertexUvs ? new THREE.Vector2(faceVertexUvs[2].x, faceVertexUvs[2].y) : null;
                    vertex = new ThreeBSP.Vertex(vertex.x, vertex.y, vertex.z, face.vertexNormals[2], uvs);
                    vertex.applyMatrix4(matrix);
                    polygon.vertices.push(vertex);
                } else if (typeof THREE.Face3) {
                    vertex = geometry.vertices[face.a];
                    uvs = faceVertexUvs ? new THREE.Vector2(faceVertexUvs[0].x, faceVertexUvs[0].y) : null;
                    vertex = new ThreeBSP.Vertex(vertex.x, vertex.y, vertex.z, face.vertexNormals[0], uvs);
                    vertex.applyMatrix4(matrix);
                    polygon.vertices.push(vertex);

                    vertex = geometry.vertices[face.b];
                    uvs = faceVertexUvs ? new THREE.Vector2(faceVertexUvs[1].x, faceVertexUvs[1].y) : null;
                    vertex = new ThreeBSP.Vertex(vertex.x, vertex.y, vertex.z, face.vertexNormals[1], uvs);
                    vertex.applyMatrix4(this.matrix);
                    polygon.vertices.push(vertex);

                    vertex = geometry.vertices[face.c];
                    uvs = faceVertexUvs ? new THREE.Vector2(faceVertexUvs[2].x, faceVertexUvs[2].y) : null;
                    vertex = new ThreeBSP.Vertex(vertex.x, vertex.y, vertex.z, face.vertexNormals[2], uvs);
                    vertex.applyMatrix4(matrix);
                    polygon.vertices.push(vertex);

                    vertex = geometry.vertices[face.d];
                    uvs = faceVertexUvs ? new THREE.Vector2(faceVertexUvs[3].x, faceVertexUvs[3].y) : null;
                    vertex = new ThreeBSP.Vertex(vertex.x, vertex.y, vertex.z, face.vertexNormals[3], uvs);
                    vertex.applyMatrix4(matrix);
                    polygon.vertices.push(vertex);
                } else {
                    throw 'Invalid face type at index ' + i;
                }

                polygon.calculateProperties();
                polygons.push(polygon);
            }

            this.tree = new ThreeBSP.Node(polygons);
        }
        ThreeBSP.prototype.subtract = function (other_tree) {
            var a = this.tree.clone(), b = other_tree.tree.clone();

            a.invert();
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            a.invert();
            return new ThreeBSP(a, this.matrix);
        };

        ThreeBSP.prototype.union = function (other_tree) {
            var a = this.tree.clone(), b = other_tree.tree.clone();

            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            return new ThreeBSP(a, this.matrix);
        };

        ThreeBSP.prototype.intersect = function (other_tree) {
            var a = this.tree.clone(), b = other_tree.tree.clone();

            a.invert();
            b.clipTo(a);
            b.invert();
            a.clipTo(b);
            b.clipTo(a);
            a.build(b.allPolygons());
            a.invert();
            return new ThreeBSP(a, this.matrix);
        };
        ThreeBSP.prototype.toGeometry = function () {
            var matrix = new THREE.Matrix4().getInverse(this.matrix), geometry = new THREE.Geometry(), polygons = this.tree.allPolygons(), polygon_count = polygons.length, polygon, polygon_vertice_count, vertice_dict = {}, vertex_idx_a, vertex_idx_b, vertex_idx_c, vertex, face, verticeUvs;

            for (var i = 0; i < polygon_count; i++) {
                polygon = polygons[i];
                polygon_vertice_count = polygon.vertices.length;

                for (var j = 2; j < polygon_vertice_count; j++) {
                    verticeUvs = [];

                    vertex = polygon.vertices[0];
                    verticeUvs.push(new THREE.Vector2(vertex.uv.x, vertex.uv.y));
                    vertex = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
                    vertex.applyMatrix4(matrix);

                    if (typeof vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z] !== 'undefined') {
                        vertex_idx_a = vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z];
                    } else {
                        geometry.vertices.push(vertex);
                        vertex_idx_a = vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z] = geometry.vertices.length - 1;
                    }

                    vertex = polygon.vertices[j - 1];
                    verticeUvs.push(new THREE.Vector2(vertex.uv.x, vertex.uv.y));
                    vertex = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
                    vertex.applyMatrix4(matrix);
                    if (typeof vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z] !== 'undefined') {
                        vertex_idx_b = vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z];
                    } else {
                        geometry.vertices.push(vertex);
                        vertex_idx_b = vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z] = geometry.vertices.length - 1;
                    }

                    vertex = polygon.vertices[j];
                    verticeUvs.push(new THREE.Vector2(vertex.uv.x, vertex.uv.y));
                    vertex = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
                    vertex.applyMatrix4(matrix);
                    if (typeof vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z] !== 'undefined') {
                        vertex_idx_c = vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z];
                    } else {
                        geometry.vertices.push(vertex);
                        vertex_idx_c = vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z] = geometry.vertices.length - 1;
                    }

                    face = new THREE.Face3(vertex_idx_a, vertex_idx_b, vertex_idx_c, new THREE.Vector3(polygon.normal.x, polygon.normal.y, polygon.normal.z));

                    geometry.faces.push(face);
                    geometry.faceVertexUvs[0].push(verticeUvs);
                }
            }
            return geometry;
        };

        ThreeBSP.prototype.toMesh = function (material) {
            var geometry = this.toGeometry(), mesh = new THREE.Mesh(geometry, material);

            mesh.position.setFromMatrixPosition(this.matrix);
            mesh.rotation.setFromRotationMatrix(this.matrix, null);

            return mesh;
        };
        return ThreeBSP;
    })();

    var ThreeBSP;
    (function (ThreeBSP) {
        var Polygon = (function () {
            function Polygon(vertices, normal, w) {
                if (typeof vertices === "undefined") { vertices = []; }
                this.vertices = vertices;
                this.normal = normal;
                this.w = w;
                if (vertices.length > 0) {
                    this.calculateProperties();
                } else {
                    this.normal = null;
                    this.w = NaN;
                }
            }
            Polygon.prototype.calculateProperties = function () {
                var a = this.vertices[0], b = this.vertices[1], c = this.vertices[2];

                this.normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();

                this.w = this.normal.clone().dot(a);

                return this;
            };

            Polygon.prototype.clone = function () {
                var polygon = new Polygon();

                for (var i = 0, vertice_count = this.vertices.length; i < vertice_count; i++) {
                    polygon.vertices.push(this.vertices[i].clone());
                }

                polygon.calculateProperties();

                return polygon;
            };

            Polygon.prototype.flip = function () {
                var vertices = [];

                this.normal.multiplyScalar(-1);
                this.w *= -1;

                for (var i = this.vertices.length - 1; i >= 0; i--) {
                    vertices.push(this.vertices[i]);
                }

                this.vertices = vertices;

                return this;
            };

            Polygon.prototype.classifyVertex = function (vertex) {
                var side_value = this.normal.dot(vertex) - this.w;

                if (side_value < -EPSILON) {
                    return BACK;
                } else if (side_value > EPSILON) {
                    return FRONT;
                } else {
                    return COPLANAR;
                }
            };

            Polygon.prototype.classifySide = function (polygon) {
                var vertex, classification, num_positive = 0, num_negative = 0, vertice_count = polygon.vertices.length;

                for (var i = 0; i < vertice_count; i++) {
                    vertex = polygon.vertices[i];
                    classification = this.classifyVertex(vertex);
                    if (classification === FRONT) {
                        num_positive++;
                    } else if (classification === BACK) {
                        num_negative++;
                    }
                }

                if (num_positive > 0 && num_negative === 0) {
                    return FRONT;
                } else if (num_positive === 0 && num_negative > 0) {
                    return BACK;
                } else if (num_positive === 0 && num_negative === 0) {
                    return COPLANAR;
                } else {
                    return SPANNING;
                }
            };

            Polygon.prototype.splitPolygon = function (polygon, coplanar_front, coplanar_back, front, back) {
                var classification = this.classifySide(polygon);

                if (classification === COPLANAR) {
                    (this.normal.dot(polygon.normal) > 0 ? coplanar_front : coplanar_back).push(polygon);
                } else if (classification === FRONT) {
                    front.push(polygon);
                } else if (classification === BACK) {
                    back.push(polygon);
                } else {
                    var f = [], b = [];

                    for (var i = 0, vertice_count = polygon.vertices.length; i < vertice_count; i++) {
                        var j = (i + 1) % vertice_count, vi = polygon.vertices[i], vj = polygon.vertices[j], ti = this.classifyVertex(vi), tj = this.classifyVertex(vj);

                        if (ti != BACK)
                            f.push(vi);
                        if (ti != FRONT)
                            b.push(vi);
                        if ((ti | tj) === SPANNING) {
                            var t = (this.w - this.normal.dot(vi)) / this.normal.dot(vj.clone().sub(vi));
                            var v = vi.interpolate(vj, t);
                            f.push(v);
                            b.push(v);
                        }
                    }

                    if (f.length >= 3)
                        front.push(new ThreeBSP.Polygon(f).calculateProperties());
                    if (b.length >= 3)
                        back.push(new ThreeBSP.Polygon(b).calculateProperties());
                }
            };
            return Polygon;
        })();
        ThreeBSP.Polygon = Polygon;

        var Vertex = (function (_super) {
            __extends(Vertex, _super);
            function Vertex(x, y, z, normal, uv) {
                if (typeof normal === "undefined") { normal = new THREE.Vector3(); }
                if (typeof uv === "undefined") { uv = new THREE.Vector2(); }
                _super.call(this, x, y, z);
                this.normal = normal;
                this.uv = uv;
            }
            Vertex.prototype.clone = function () {
                return new Vertex(this.x, this.y, this.z, this.normal.clone(), this.uv.clone());
            };

            Vertex.prototype.interpolate = function (other, t) {
                return this.clone().lerp(other, t);
            };
            return Vertex;
        })(THREE.Vector3);
        ThreeBSP.Vertex = Vertex;

        var Node = (function () {
            function Node(polygons) {
                if (typeof polygons === "undefined") { polygons = []; }
                this.polygons = polygons;
                if (polygons.length) {
                    var front = [], back = [];

                    this.divider = polygons[0].clone();

                    for (var i = 0, polygon_count = polygons.length; i < polygon_count; i++) {
                        this.divider.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
                    }

                    if (front.length > 0) {
                        this.front = new ThreeBSP.Node(front);
                    }

                    if (back.length > 0) {
                        this.back = new ThreeBSP.Node(back);
                    }
                }
            }
            Node.isConvex = function (polygons) {
                var i, j;
                for (i = 0; i < polygons.length; i++) {
                    for (j = 0; j < polygons.length; j++) {
                        if (i !== j && polygons[i].classifySide(polygons[j]) !== BACK) {
                            return false;
                        }
                    }
                }
                return true;
            };

            Object.defineProperty(Node.prototype, "isConvex", {
                get: function () {
                    return Node.isConvex(this.polygons);
                },
                enumerable: true,
                configurable: true
            });

            Node.prototype.build = function (polygons) {
                var front = [], back = [];

                if (!this.divider) {
                    this.divider = polygons[0].clone();
                }

                for (var i = 0, polygon_count = polygons.length; i < polygon_count; i++) {
                    this.divider.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
                }

                if (front.length > 0) {
                    if (!this.front)
                        this.front = new ThreeBSP.Node();
                    this.front.build(front);
                }

                if (back.length > 0) {
                    if (!this.back)
                        this.back = new ThreeBSP.Node();
                    this.back.build(back);
                }
            };

            Node.prototype.allPolygons = function () {
                var polygons = this.polygons.slice();
                if (this.front)
                    polygons = polygons.concat(this.front.allPolygons());
                if (this.back)
                    polygons = polygons.concat(this.back.allPolygons());
                return polygons;
            };

            Node.prototype.clone = function () {
                var node = new ThreeBSP.Node();

                node.divider = this.divider.clone();
                node.polygons = this.polygons.map(function (polygon) {
                    return polygon.clone();
                });
                node.front = this.front && this.front.clone();
                node.back = this.back && this.back.clone();

                return node;
            };

            Node.prototype.invert = function () {
                var i, polygon_count, temp;

                for (i = 0, polygon_count = this.polygons.length; i < polygon_count; i++) {
                    this.polygons[i].flip();
                }

                this.divider.flip();
                if (this.front)
                    this.front.invert();
                if (this.back)
                    this.back.invert();

                temp = this.front;
                this.front = this.back;
                this.back = temp;

                return this;
            };

            Node.prototype.clipPolygons = function (polygons) {
                if (!this.divider)
                    return polygons.slice();

                var front = [], back = [];

                for (var i = 0, polygon_count = polygons.length; i < polygon_count; i++) {
                    this.divider.splitPolygon(polygons[i], front, back, front, back);
                }

                if (this.front)
                    front = this.front.clipPolygons(front);
                if (this.back)
                    back = this.back.clipPolygons(back);
                else
                    back = [];

                return front.concat(back);
            };

            Node.prototype.clipTo = function (node) {
                this.polygons = node.clipPolygons(this.polygons);
                if (this.front)
                    this.front.clipTo(node);
                if (this.back)
                    this.back.clipTo(node);
            };
            return Node;
        })();
        ThreeBSP.Node = Node;
    })(ThreeBSP || (ThreeBSP = {}));

    
    return ThreeBSP;
});
//# sourceMappingURL=BSP.js.map