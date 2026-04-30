use crate::{
    models::graph::{GraphEdge, GraphNode, GraphResponse},
    services::error::AppResult,
    storage::FileStorage,
};

pub fn get_graph(storage: &FileStorage) -> AppResult<GraphResponse> {
    let notes = storage.notes()?;
    let nodes = notes
        .iter()
        .map(|note| GraphNode {
            id: note.id.clone(),
            label: note.title.clone(),
            kind: "note".to_string(),
        })
        .collect::<Vec<_>>();

    // The first graph version keeps deterministic adjacency so the frontend can
    // integrate rendering before backlinks and tag indexes are implemented.
    let edges = notes
        .windows(2)
        .map(|pair| GraphEdge {
            source: pair[0].id.clone(),
            target: pair[1].id.clone(),
            relation: "next".to_string(),
        })
        .collect();

    Ok(GraphResponse { nodes, edges })
}
